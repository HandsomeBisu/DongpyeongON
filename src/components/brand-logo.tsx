import Image from "next/image";
import Link from "next/link";

export function BrandLogo({ dark = false }: { dark?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="동평ON 홈"
      className={`inline-flex shrink-0 items-center rounded-xl ${dark ? "bg-white px-3 py-2" : ""}`}
    >
      <Image
        src="https://assets.dpsteam.kr/dpon/dpon.png"
        alt="동평ON"
        width={196}
        height={48}
        priority
        className="h-8 w-auto object-contain sm:h-9"
      />
    </Link>
  );
}
