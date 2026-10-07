"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createCategory, deleteCategory, renameCategory, type CategoryState } from "./actions";

export function AddCategoryForm() {
  const [state, action, pending] = useActionState<CategoryState, FormData>(createCategory, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      toast.success("Category added");
    }
  }, [state]);
  return (
    <form ref={ref} action={action} className="flex flex-col gap-2 sm:flex-row">
      <div className="flex-1">
        <input name="name" placeholder="New category name, e.g. Activewear" required className="h-10 w-full border bg-white px-3 text-[14px] outline-none focus:border-foreground" aria-label="Category name" />
        {state.error && <p className="mt-1 text-[13px] text-sale">{state.error}</p>}
      </div>
      <Button type="submit" size="sm" className="h-10" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Add category
      </Button>
    </form>
  );
}

export function CategoryRow({ id, name, slug, products }: { id: string; name: string; slug: string; products: number }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<CategoryState>, success: string) =>
    startTransition(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else {
        toast.success(success);
        setEditing(false);
      }
    });

  return (
    <tr className="hover:bg-surface/40">
      <td className="px-4 py-3 text-[14px]">
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(() => renameCategory(id, value), "Category renamed");
            }}
            className="flex gap-2"
          >
            <input value={value} onChange={(e) => setValue(e.target.value)} autoFocus className="h-9 flex-1 border px-2 outline-none focus:border-foreground" aria-label="Category name" />
            <Button type="submit" size="sm" disabled={pending}>Save</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => { setEditing(false); setValue(name); }}>Cancel</Button>
          </form>
        ) : (
          name
        )}
      </td>
      <td className="px-4 py-3 font-mono text-[12px] text-muted">{slug}</td>
      <td className="px-4 py-3 text-right text-[14px]">{products}</td>
      <td className="px-4 py-3 text-right">
        {!editing && (
          <div className="flex justify-end gap-1">
            <button onClick={() => setEditing(true)} className="p-2 text-muted hover:text-foreground" aria-label={`Rename ${name}`}>
              <Pencil className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => run(() => deleteCategory(id), "Category deleted")}
              disabled={pending}
              className="p-2 text-muted hover:text-sale disabled:opacity-40"
              aria-label={`Delete ${name}`}
              title={products > 0 ? "Categories with products can't be deleted" : "Delete"}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" strokeWidth={1.5} />}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
