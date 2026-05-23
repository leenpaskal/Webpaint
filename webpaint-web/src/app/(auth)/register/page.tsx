import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Sign up — Webpaint",
  description: "Create your Webpaint account.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
