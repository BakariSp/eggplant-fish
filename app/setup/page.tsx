import { verifyEditKey } from "@/server/actions/verifyEditKey";

export default function SetupPage() {
  async function action(formData: FormData) {
    "use server";
    const slug = formData.get("slug");
    const editKey = formData.get("editKey");
    await verifyEditKey({ slug, editKey });
  }

  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold">Tag Setup</h1>
      <form action={action} className="mt-4 space-y-3 max-w-sm">
        <input name="slug" placeholder="Pet slug" className="border p-2 w-full" />
        <input name="editKey" placeholder="Edit key" className="border p-2 w-full" />
        <button type="submit" className="px-3 py-2 bg-black text-white rounded">
          Verify Key
        </button>
      </form>
    </main>
  );
}


