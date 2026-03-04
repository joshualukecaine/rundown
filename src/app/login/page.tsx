import Image from "next/image";
import Link from "next/link";
import logo from "../../../public/logo.png";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="synthwave-card w-full max-w-sm rounded-xl p-8 text-center">
        <div className="mb-6 flex justify-center">
          <Image src={logo} alt="RunDown" width={120} height={120} />
        </div>

        <p className="mb-8 text-sm text-muted-foreground">
          Sign in with your Intervals.icu account to view your training plan and stats.
        </p>

        <Link
          href="/api/auth/login"
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 neon-glow-pink"
        >
          Sign in with Intervals.icu
        </Link>
      </div>
    </div>
  );
}
