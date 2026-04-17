import { useEffect } from "react";
import { useLocation } from "wouter";

export default function LoginCallbackPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/");
  }, [setLocation]);

  return null;
}
