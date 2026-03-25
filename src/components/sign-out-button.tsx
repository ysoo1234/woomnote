import { signOut } from "@/auth";

type SignOutButtonProps = {
  className?: string;
  label?: string;
};

export function SignOutButton({
  className,
  label = "로그아웃",
}: SignOutButtonProps) {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className={
          className ??
          "rounded-full border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
        }
      >
        {label}
      </button>
    </form>
  );
}
