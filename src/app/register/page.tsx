import { RegisterForm } from "@/app/register/RegisterForm";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Skeleton className="w-full max-w-md h-[500px]" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
