import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "signup" };

export default function Page() {
  return <Suspense><AuthForm mode="signup" /></Suspense>;
}
