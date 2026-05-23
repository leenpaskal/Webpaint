import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log in — Webpaint",
  description: "Log in to your Webpaint account.",
};

export default function LoginPage() {
  return <LoginForm />;
}
