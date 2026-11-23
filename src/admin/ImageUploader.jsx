import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { uploadImage } from "./api";
import { errMsg } from "./ui";

/** Upload one or many photos to ImageKit. `images` is an array of URLs; the first is the cover photo. */
export default function ImageUploader({ images, onChange, folder = "products", single = false }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(0);
  const [link, setLink] = useState("");

  const handleFiles = async (fileList) => {
    const files = [...fileList].filter((f) => f.type.startsWith("image/"));
    if (!files.length) return toast.error("Please choose image files.");
    setBusy((n) => n + files.length);
    const added = [];
    for (const file of files) {
      try {
        added.push(await uploadImage(file, folder));
      } catch (err) {
        toast.error(errMsg(err));
      } finally {
        setBusy((n) => n - 1);
      }
    }
    if (added.length) onChange(single ? [added[added.length - 1]] : [...images, ...added]);
    if (input.current) input.current.value = "";
  };

  const move = (i, d) => {
    const next = [...images];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const addLink = () => {
    const url = link.trim();
    if (!/^https?:\/\//i.test(url)) return toast.error("Paste a full link starting with https://");
    onChange(single ? [url] : [...images, url]);
    setLink("");
  };

  return (
    <div>
      {images.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((url, i) => (
            <li key={url + i} className="group relative overflow-hidden rounded-sm border border-ivory/15 bg-evergreen">
              <img src={url} alt="" className="aspect-[4/5] w-full object-cover" />
              {!single && i === 0 && <span className="absolute left-1 top-1 rounded-full bg-forest/85 px-2 py-0.5 text-[10px] text-gold">Cover</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-forest/85 p-1">
                {!single && (
                  <>
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier" className="rounded p-1 text-ivory disabled:opacity-30">
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label="Move later" className="rounded p-1 text-ivory disabled:opacity-30">
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </>
                )}
                <button type="button" onClick={() => onChange(images.filter((_, n) => n !== i))} aria-label="Remove photo" className="ml-auto rounded p-1 text-red-300">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input ref={input} type="file" accept="image/*" multiple={!single} className="sr-only" id={`up-${folder}`} onChange={(e) => handleFiles(e.target.files)} />
      <label
        htmlFor={`up-${folder}`}
        className="flex cursor-pointer items-center justify-center gap-2 rounded-sm border border-dashed border-ivory/30 px-4 py-5 text-sm text-mist transition-colors hover:border-ivory/60 hover:text-ivory"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-4 w-4" aria-hidden="true" />}
        {busy ? `Uploading ${busy}…` : single ? "Choose a photo" : "Add photos (you can pick several)"}
      </label>

      <div className="mt-2 flex gap-2">
        <input className="field" placeholder="…or paste an image link (https://…)" value={link} onChange={(e) => setLink(e.target.value)} aria-label="Image link" />
        <button type="button" onClick={addLink} className="rounded-sm border border-ivory/25 px-4 text-sm text-ivory hover:bg-ivory/10">Add</button>
      </div>
    </div>
  );
}
