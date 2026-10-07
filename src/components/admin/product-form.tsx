"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Loader2, Plus, Trash2, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError, Input, Select, Textarea } from "@/components/ui/form-controls";
import { productSchema, SIZES } from "@/lib/validations";
import { useUploadThing } from "@/lib/uploadthing";
import { isAllowedImageUrl } from "@/lib/images";
import { cn } from "@/lib/utils";
import { deleteProduct, saveProduct } from "@/app/admin/(panel)/products/actions";

type FormIn = z.input<typeof productSchema>;
type FormOut = z.output<typeof productSchema>;

const num = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : Number(v));
const cellInput = "h-9 w-full border border-border bg-white px-2 text-[14px] outline-none focus:border-foreground aria-[invalid=true]:border-sale";

export function ProductForm({
  categories,
  initial,
  productId,
}: {
  categories: { id: string; name: string }[];
  initial?: FormIn;
  productId?: string;
}) {
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(productSchema),
    defaultValues: initial ?? {
      name: "",
      description: "",
      categoryId: categories[0]?.id ?? "",
      price: undefined,
      compareAtPrice: null,
      images: [],
      isActive: true,
      isNew: true,
      isFeatured: false,
      variants: [],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "variants", keyName: "_key" });
  const images = useWatch({ control, name: "images" }) ?? [];
  const name = useWatch({ control, name: "name" });
  const variants = useWatch({ control, name: "variants" }) ?? [];

  // ---- images -------------------------------------------------------------
  const { startUpload, isUploading } = useUploadThing("productImage", {
    onClientUploadComplete: (res) => {
      setValue("images", [...getValues("images"), ...res.map((r) => r.ufsUrl)], { shouldDirty: true, shouldValidate: true });
      toast.success(`Uploaded ${res.length} image${res.length === 1 ? "" : "s"}`);
    },
    onUploadError: (e) => {
      toast.error(e.message === "Unauthorized" ? "Your session expired. Sign in again." : `Upload failed: ${e.message}`);
    },
  });

  function moveImage(i: number, dir: -1 | 1) {
    const list = [...images];
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    setValue("images", list, { shouldDirty: true });
  }

  function addImageUrl() {
    const url = urlDraft.trim();
    if (!isAllowedImageUrl(url)) {
      toast.error("Use an image uploaded here, or an images.unsplash.com link.");
      return;
    }
    setValue("images", [...images, url], { shouldDirty: true, shouldValidate: true });
    setUrlDraft("");
  }

  // ---- variant generator ----------------------------------------------------
  const [genSizes, setGenSizes] = useState<string[]>(["S", "M", "L", "XL"]);
  const [genColours, setGenColours] = useState([{ name: "", hex: "#111111" }]);

  function generate() {
    const colours = genColours.filter((c) => c.name.trim());
    if (!colours.length || !genSizes.length) {
      toast.error("Pick at least one size and enter a colour name.");
      return;
    }
    const prefix =
      (name || "PRD")
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 4) || "PRD";
    const existing = new Set(variants.map((v) => `${v.size}|${String(v.colour).toLowerCase()}`));
    let added = 0;
    for (const c of colours) {
      for (const size of SIZES.filter((s) => genSizes.includes(s))) {
        if (existing.has(`${size}|${c.name.trim().toLowerCase()}`)) continue;
        append({
          size,
          colour: c.name.trim(),
          colourHex: c.hex,
          sku: `${prefix}-${c.name.replace(/\s+/g, "").slice(0, 3).toUpperCase()}-${size === "Free Size" ? "OS" : size}`,
          stock: 0,
        });
        added++;
      }
    }
    toast.success(added ? `Added ${added} variant${added === 1 ? "" : "s"}. Set the stock for each.` : "Those variants already exist.");
  }

  // ---- submit ---------------------------------------------------------------
  function onSubmit(values: FormOut) {
    startSaving(async () => {
      const res = await saveProduct(values, productId);
      if (!res.ok) {
        for (const [field, msgs] of Object.entries(res.fieldErrors ?? {})) {
          if (msgs?.[0]) setError(field as keyof FormIn, { message: msgs[0] });
        }
        toast.error(res.error);
        return;
      }
      toast.success(productId ? "Product saved" : "Product created");
      if (productId) router.refresh();
      else router.push(`/admin/products/${res.id}`);
    });
  }

  async function onDelete() {
    if (!productId) return;
    setDeleting(true);
    const res = await deleteProduct(productId);
    if (res.ok) {
      toast.success("Product deleted");
      router.push("/admin/products");
    } else {
      toast.error(res.error);
      setDeleting(false);
    }
  }

  const totalStock = variants.reduce((n, v) => n + (Number(v.stock) || 0), 0);
  const box = "border bg-white";
  const boxHead = "border-b px-5 py-3.5 text-[13px] font-semibold";

  return (
    <form onSubmit={handleSubmit(onSubmit, () => toast.error("Please fix the highlighted fields."))} noValidate className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-6">
        {/* Details */}
        <section className={box}>
          <h2 className={boxHead}>Details</h2>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Name" htmlFor="name" error={errors.name?.message} className="sm:col-span-2">
              <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
            </Field>
            <Field label="Description" htmlFor="description" error={errors.description?.message} className="sm:col-span-2">
              <Textarea id="description" rows={4} aria-invalid={!!errors.description} {...register("description")} />
            </Field>
            <Field label="Selling price (Rs)" htmlFor="price" error={errors.price?.message}>
              <Input id="price" type="number" min={1} inputMode="numeric" aria-invalid={!!errors.price} {...register("price", { setValueAs: num })} />
            </Field>
            <Field label="Original price (Rs)" htmlFor="compareAtPrice" error={errors.compareAtPrice?.message} hint="Optional. Set it to show the item as on sale.">
              <Input id="compareAtPrice" type="number" min={0} inputMode="numeric" aria-invalid={!!errors.compareAtPrice} {...register("compareAtPrice", { setValueAs: (v) => num(v) ?? null })} />
            </Field>
          </div>
        </section>

        {/* Images */}
        <section className={box}>
          <h2 className={boxHead}>Images</h2>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((src, i) => (
                <div key={src + i} className="group relative aspect-[3/4] bg-surface">
                  <Image src={src} alt="" fill sizes="160px" className="object-cover" />
                  {i === 0 && <span className="label absolute left-1.5 top-1.5 bg-white px-1.5 py-0.5">Cover</span>}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between bg-white/90 p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} className="p-1 disabled:opacity-30" aria-label="Move image left">
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setValue("images", images.filter((_, j) => j !== i), { shouldDirty: true })} className="p-1 text-sale" aria-label="Remove image">
                      <X className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} className="p-1 disabled:opacity-30" aria-label="Move image right">
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={isUploading}
                className="flex aspect-[3/4] flex-col items-center justify-center gap-2 border border-dashed text-[13px] text-muted hover:border-foreground hover:text-foreground"
              >
                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" strokeWidth={1.5} />}
                {isUploading ? "Uploading…" : "Upload"}
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) startUpload(files);
                e.target.value = "";
              }}
            />
            <div className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addImageUrl();
                    }
                  }}
                  placeholder="…or paste an image URL"
                  className="h-10 w-full border pl-9 pr-3 text-[14px] outline-none focus:border-foreground"
                  aria-label="Image URL"
                />
              </div>
              <Button type="button" variant="outline" size="sm" className="h-10" onClick={addImageUrl}>
                Add
              </Button>
            </div>
            <FieldError message={errors.images?.message ?? errors.images?.root?.message} />
            <p className="mt-2 text-[12px] text-muted">JPG, PNG or WebP up to 4MB. The first image is the cover; use the arrows to reorder.</p>
          </div>
        </section>

        {/* Variants & stock */}
        <section className={box}>
          <div className="flex items-center justify-between border-b px-5 py-3.5">
            <h2 className="text-[13px] font-semibold">Sizes, colours & stock</h2>
            <span className="text-[13px] text-muted">
              {fields.length} variants · {totalStock} units
            </span>
          </div>

          <div className="border-b bg-surface/50 p-5">
            <p className="mb-3 flex items-center gap-2 text-[13px] font-medium">
              <Wand2 className="h-4 w-4" /> Quick generate
            </p>
            <div className="mb-3 flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setGenSizes((g) => (g.includes(s) ? g.filter((x) => x !== s) : [...g, s]))}
                  aria-pressed={genSizes.includes(s)}
                  className={cn("h-8 border px-2.5 text-[13px]", genSizes.includes(s) ? "border-foreground bg-foreground text-white" : "bg-white")}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {genColours.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="color"
                    value={c.hex}
                    onChange={(e) => setGenColours((g) => g.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))}
                    className="h-9 w-10 cursor-pointer border bg-white p-0.5"
                    aria-label="Colour swatch"
                  />
                  <input
                    value={c.name}
                    onChange={(e) => setGenColours((g) => g.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                    placeholder="Colour name, e.g. Black"
                    className={cn(cellInput, "flex-1")}
                    aria-label="Colour name"
                  />
                  {genColours.length > 1 && (
                    <button type="button" onClick={() => setGenColours((g) => g.filter((_, j) => j !== i))} className="px-2 text-muted hover:text-sale" aria-label="Remove colour">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="bg-white" onClick={() => setGenColours((g) => [...g, { name: "", hex: "#cccccc" }])}>
                <Plus className="h-4 w-4" /> Colour
              </Button>
              <Button type="button" size="sm" onClick={generate}>
                Generate variants
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="border-b">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <th className="px-3 py-2.5 pl-5">Size</th>
                  <th className="px-3 py-2.5">Colour</th>
                  <th className="px-3 py-2.5">SKU</th>
                  <th className="w-28 px-3 py-2.5">Stock</th>
                  <th className="w-12 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {fields.map((f, i) => {
                  const e = errors.variants?.[i];
                  return (
                    <tr key={f._key}>
                      <td className="px-3 py-2 pl-5">
                        <select className={cellInput} aria-label="Size" {...register(`variants.${i}.size`)}>
                          {SIZES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1.5">
                          <input type="color" className="h-9 w-9 shrink-0 cursor-pointer border p-0.5" aria-label="Colour swatch" {...register(`variants.${i}.colourHex`)} />
                          <input className={cellInput} aria-label="Colour" aria-invalid={!!e?.colour} {...register(`variants.${i}.colour`)} />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input className={cn(cellInput, "font-mono text-[13px] uppercase")} aria-label="SKU" aria-invalid={!!e?.sku} {...register(`variants.${i}.sku`)} />
                        {e?.sku && <p className="mt-1 text-[12px] text-sale">{e.sku.message}</p>}
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} inputMode="numeric" className={cellInput} aria-label="Stock" aria-invalid={!!e?.stock} {...register(`variants.${i}.stock`, { setValueAs: (v) => num(v) ?? 0 })} />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button type="button" onClick={() => remove(i)} className="p-1.5 text-muted hover:text-sale" aria-label="Remove variant">
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {fields.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-[14px] text-muted">
                      No variants yet. Use Quick generate above, or add one manually.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t px-5 py-3">
            <FieldError message={errors.variants?.message ?? errors.variants?.root?.message} />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => append({ size: "M", colour: "", colourHex: "#111111", sku: "", stock: 0 })}
            >
              <Plus className="h-4 w-4" /> Add variant
            </Button>
          </div>
        </section>
      </div>

      {/* Sidebar */}
      <div className="space-y-6 lg:sticky lg:top-10 lg:self-start">
        <section className={box}>
          <h2 className={boxHead}>Organisation</h2>
          <div className="space-y-4 p-5">
            <Field label="Category" htmlFor="categoryId" error={errors.categoryId?.message}>
              <Select id="categoryId" {...register("categoryId")}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            {[
              { key: "isActive" as const, label: "Visible in store", hint: "Hidden products can't be bought." },
              { key: "isNew" as const, label: "Mark as new arrival", hint: "Shown in New In." },
              { key: "isFeatured" as const, label: "Featured", hint: "Highlighted on the home page." },
            ].map((t) => (
              <label key={t.key} className="flex cursor-pointer gap-3">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-foreground" {...register(t.key)} />
                <span className="text-[14px]">
                  {t.label}
                  <span className="block text-[12px] text-muted">{t.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <div className="space-y-3">
          <Button type="submit" size="lg" className="w-full" disabled={saving || isUploading}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {productId ? "Save changes" : "Create product"}
          </Button>
          {productId && isDirty && <p className="text-center text-[12px] text-muted">You have unsaved changes.</p>}
        </div>

        {productId &&
          (confirmDelete ? (
            <div className="border border-sale/40 bg-sale/5 p-4 text-[13px]">
              <p className="mb-3">Delete this product permanently? Past orders keep their item details.</p>
              <div className="flex gap-2">
                <Button type="button" variant="danger" size="sm" onClick={onDelete} disabled={deleting}>
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" />} Delete
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                  Keep
                </Button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="w-full text-center text-[13px] text-sale hover:underline">
              Delete product
            </button>
          ))}
      </div>
    </form>
  );
}
