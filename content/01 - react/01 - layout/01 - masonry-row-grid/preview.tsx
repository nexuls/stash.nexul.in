"use client";

/**
 * Demos for the masonry row grid, rendered by `<ComponentPreview>` in
 * README.mdx. Each export is one example; the frame around them owns the
 * viewport width and the frame-rate readout, so nothing here measures itself.
 */

import Image from "next/image";
import { MasonryRowGrid } from "./masonry-row-grid";

/**
 * Cloudinary serves each photo at the size the layout asked for, so widening
 * the preview fetches a sharper file rather than upscaling one.
 */
const CLOUDINARY = "https://res.cloudinary.com/djoo8ogmp/image/upload";

/** Intrinsic dimensions matter here: the layout is solved from aspect ratios. */
const photos = [
  {
    ratio: 1667 / 2500,
    path: "/v1767112251/uploaded/image-1767112234730_xoehkl.jpg",
  },
  {
    ratio: 3264 / 2448,
    path: "/v1767113284/uploaded/image-1767113275676_oe1xni.jpg",
  },
  {
    ratio: 1667 / 2500,
    path: "/v1767112251/uploaded/image-1767112236866_xmhtsr.jpg",
  },
  {
    ratio: 3729 / 4434,
    path: "/v1767112458/uploaded/image-1767112438435_gebcr5.jpg",
  },
  {
    ratio: 2670 / 4000,
    path: "/v1767112457/uploaded/image-1767112450944_o28d6i.jpg",
  },
  {
    ratio: 1667 / 2500,
    path: "/v1767112456/uploaded/image-1767112433651_lv7rgh.jpg",
  },
  {
    ratio: 1667 / 2500,
    path: "/v1767109534/uploaded/image-1767109525282_krfx4s.jpg",
  },
  {
    ratio: 3264 / 4928,
    path: "/v1767112458/uploaded/image-1767112447354_kgf6er.jpg",
  },
  {
    ratio: 1667 / 2500,
    path: "/v1767109137/uploaded/image-1767109129557_nmnivi.jpg",
  },
  {
    ratio: 1667 / 2500,
    path: "/v1767109535/uploaded/image-1767109523712_gkj21w.jpg",
  },
  {
    ratio: 1667 / 2500,
    path: "/v1767112251/uploaded/image-1767112227934_h8wjsw.jpg",
  },
  {
    ratio: 1836 / 3264,
    path: "/v1767112456/uploaded/image-1767112440868_fvbbqj.jpg",
  },
  {
    ratio: 1667 / 2500,
    path: "/v1767109533/uploaded/image-1767109489417_vqoumo.jpg",
  },
  {
    ratio: 1667 / 2500,
    path: "/v1767109532/uploaded/image-1767109521752_lp4fr4.jpg",
  },
  {
    ratio: 1667 / 2500,
    path: "/v1767112251/uploaded/image-1767112230503_xh8a6p.jpg",
  },
  {
    ratio: 2448 / 3264,
    path: "/v1767113102/uploaded/image-1767113096803_cjb3fd.jpg",
  },
  {
    ratio: 831 / 1280,
    path: "/v1767113101/uploaded/image-1767113093689_h9zqpv.jpg",
  },
  {
    ratio: 1667 / 2500,
    path: "/v1767113101/uploaded/image-1767113091714_gl2xoj.jpg",
  },
  {
    ratio: 3072 / 4608,
    path: "/v1767113176/uploaded/image-1767113173570_vgrj0o.jpg",
  },
  {
    ratio: 853 / 1280,
    path: "/v1767113286/uploaded/image-1767113278265_xn0hun.jpg",
  },
];

const items = photos.map((photo) => ({
  width: 200,
  height: Math.round(300 * photo.ratio),
  path: photo.path,
}));

function Photo({
  item,
  index,
}: {
  item: (typeof items)[number];
  index: number;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-md bg-muted">
      <Image
        src={`${CLOUDINARY}/w_${item.width},h_${item.height},c_fill${item.path}`}
        alt={`Photograph ${index + 1}`}
        fill
        sizes="(max-width: 640px) 50vw, 300px"
        className="object-cover"
      />
    </div>
  );
}

/**
 * The justified layout: rows are chosen by dynamic programming, so every row
 * is flush on both edges and heights stay close to the target.
 */
export function Preview() {
  return (
    <MasonryRowGrid
      containerProps={{ className: "w-full" }}
      items={items}
      targetHeight={200}
      scaleFactor={0.1}
      layout="justified"
      renderItem={(item, index) => (
        <Photo item={item as (typeof items)[number]} index={index} />
      )}
    />
  );
}

/**
 * The greedy layout, for comparison: it fills each row until it overflows and
 * then scales the row down, which leaves the last row short.
 */
export function Naive() {
  return (
    <MasonryRowGrid
      containerProps={{ className: "w-full" }}
      items={items}
      targetHeight={200}
      scaleFactor={0.1}
      layout="naive"
      renderItem={(item, index) => (
        <Photo item={item as (typeof items)[number]} index={index} />
      )}
    />
  );
}
