import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** wa.me link built from the configured number (digits only). */
export function WhatsAppLink({
  number,
  label = "WhatsApp",
  message,
  variant = "outline",
  size = "sm",
  className,
}: {
  number: string;
  label?: string;
  message?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  const digits = number.replace(/[^0-9]/g, "");
  const href = `https://wa.me/${digits}${
    message ? `?text=${encodeURIComponent(message)}` : ""
  }`;

  return (
    <Button variant={variant} size={size} className={className} asChild>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Scrivici su WhatsApp${message ? " per questa auto" : ""}`}
      >
        <MessageCircle data-icon="inline-start" />
        {label}
      </a>
    </Button>
  );
}
