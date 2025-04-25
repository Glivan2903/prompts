interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const sizes = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12"
  };

  return (
    <img
      src="https://admin.painel.zapfacil.com/storage/application/559c234624104e187bc11512b7475e40.png"
      alt="Gerador de Prompt Logo"
      className={`${sizes[size]} w-auto ${className}`}
    />
  );
} 