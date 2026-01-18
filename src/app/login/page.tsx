import { LoginForm } from "@/app/login/LoginForm";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Skeleton className="w-full max-w-md h-96" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
