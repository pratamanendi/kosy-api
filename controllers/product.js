import { PrismaClient } from '@prisma/client';
import { checkField, errorHandler } from '../composables/index.js';

const prisma = new PrismaClient();

// Get all products
export const getAll = async (req, res) => {
    try {
        const products = await prisma.products.findMany({
            where: { deleted_at: null },
            select: {
                id: true,
                name: true,
                description: true,
                thumbnail: true,
                created_by: true,
                created_at: true,
                meta: {
                    select: {
                        meta_key: true,
                        meta_value: true
                    }
                }
            },
        });

        res.status(200).json(
            products.map(product => {
                const metaFields = Object.fromEntries(
                    product.meta.map(({ meta_key, meta_value }) => [meta_key, meta_value])
                );
                const { meta, ...rest } = product;
                return {
                    ...rest,
                    ...metaFields
                };
            })
        );
    } catch (err) {
        return errorHandler(err, req, res, 'Failed to fetch products');
    }
};

// Get product by ID
export const getById = async (req, res) => {
    try {
        const products = await prisma.products.findMany({
            where: { deleted_at: null, id: req.params.id },
            select: {
                id: true,
                name: true,
                description: true,
                thumbnail: true,
                created_by: true,
                created_at: true,
                meta: {
                    select: {
                        meta_key: true,
                        meta_value: true
                    }
                }
            },
        });

        res.status(200).json(
            products.map(product => {
                const metaFields = Object.fromEntries(
                    product.meta.map(({ meta_key, meta_value }) => [meta_key, meta_value])
                );
                const { meta, ...rest } = product;
                return {
                    ...rest,
                    ...metaFields
                };
            })
        );
    } catch (err) {
        return errorHandler(err, req, res, 'Failed to fetch products');
    }
};

// Create new product
export const create = async (req, res) => {
    const { name, description, thumbnail, ...meta } = req.body;
    const { sub: user_id } = req.user;

    const required = ['name', 'description', 'thumbnail', 'price', 'stock'];
    const missing = checkField(req.body, required)

    if (missing.length) {
        return res.status(400).json({ error: `${missing.join(', ')} is Required` });
    }

    const metaMap = Object.entries(meta).map(([key, value]) => ({ meta_key: key.replace(/\s/g, '_'), meta_value: value }));

    try {
        const newProduct = await prisma.products.create({
            data: {
                name,
                description,
                thumbnail,
                created_by: user_id,
                meta: {
                    createMany: {
                        data: metaMap
                    }
                }
            },
            select: {
                id: true,
                name: true,
                description: true,
                thumbnail: true,
                meta: true
            }
        });

        const { meta: rest, ...product } = newProduct

        const metaFields = Object.fromEntries(
            rest.map(({ meta_key, meta_value }) => [meta_key, meta_value])
        );

        const response = {
            ...product,
            ...metaFields
        };

        return res.status(201).send(response);
    } catch (err) {
        return errorHandler(err, req, res, 'Failed to create product');
    }
};

// Update product
export const update = async (req, res) => {
    const { name, description, thumbnail, ...meta } = req.body;
    const { sub: user_id } = req.user;
    const { id } = req.params

    const required = ['name', 'description', 'thumbnail', 'price', 'stock'];
    const missing = checkField(req.body, required)

    if (missing.length) {
        return res.status(400).json({ error: `${missing.join(', ')} is Required` });
    }

    try {
        const upsertMany = Object.entries(meta).map(([meta_key, meta_value]) => {
            return prisma.productMeta.upsert({
                where: {
                    product_id_meta_key: {
                        product_id: id,
                        meta_key: meta_key.replace(/\s/g, '_')
                    }
                },
                create: {
                    product_id: id,
                    meta_key: meta_key.replace(/\s/g, '_'),
                    meta_value: String(meta_value)
                },
                update: {
                    meta_value: String(meta_value)
                }
            });
        });

        const [updatedProduct, ...rest] = await prisma.$transaction(async (prisma) => {
            return await Promise.all([
                prisma.products.update({
                    where: { id },
                    data: {
                        name,
                        description,
                        thumbnail,
                        updated_at: new Date(),
                        updated_by: user_id,
                    },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        thumbnail: true,
                    },
                }),
                ...upsertMany,
            ]);
        });

        const metaFields = Object.fromEntries(
            rest.map(({ meta_key, meta_value }) => [meta_key, meta_value])
        );

        const response = {
            ...updatedProduct,
            ...metaFields
        };

        return res.status(200).send(response);
    } catch (err) {
        return errorHandler(err, req, res, 'Failed to update product');
    }
};

// Delete product
export const deleteProduct = async (req, res) => {
    const { sub: user_id, role } = req.user

    if (!role || role < 2) return res.status(401).json({ error: 'Unauthorized [role]' })

    try {
        await prisma.products.update({
            where: { id: req.params.id },
            data: {
                deleted_at: new Date(),
                deleted_by: user_id
            },
        });
        res.json({ message: 'Product deleted' });
    } catch (err) {
        return errorHandler(err, req, res, 'Failed to delete product');
    }
};

export const deleteProductMeta = async (req, res) => {
    const { id: product_id, key: meta_key } = req.params;
    try {
        const deletedMeta = await prisma.productMeta.delete({
            where: {
                product_id_meta_key: {
                    product_id,
                    meta_key
                }
            },
        });
        if (!deletedMeta) {
            return res.status(404).json({ error: 'Product Meta not found' });
        }
        res.json({ message: 'Product Meta deleted' });
    } catch (err) {
        if (err.code === 'P2025') { // Prisma error code for record not found
            return res.status(404).json({ error: 'Product Meta not found' });
        }
        return errorHandler(err, req, res, 'Failed to delete product meta');
    }
};
