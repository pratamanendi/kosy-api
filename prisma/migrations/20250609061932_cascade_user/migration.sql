-- DropForeignKey
ALTER TABLE "Users" DROP CONSTRAINT "Users_employee_id_fkey";

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
