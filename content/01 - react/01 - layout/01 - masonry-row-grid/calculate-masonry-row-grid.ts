import type { GridItemProps, Measures } from "./masonry-row-grid";

/**
 * Calculates the masonry layout for a set of items within a given viewport width.
 * @param viewportWidth - The width of the container in which the items will be laid out.
 * @param items - An array of items to be laid out, each with width and height properties.
 * @param targetHeight - The desired height for each row in the layout.
 * @param scaleFactor - A factor to allow rows to deviate from the target height.
 *
 * @returns [Measures[], totalHeight, rowCount]
 */
export function calculateNaiveMasonryLayout({
  viewportWidth,
  items,
  targetHeight,
  scaleFactor = 0.1,
}: {
  viewportWidth: number;
  items: GridItemProps[];
  targetHeight: number;
  scaleFactor?: number;
}) {
  const max_height = targetHeight * (1 + scaleFactor);

  let rows: Measures[] = [];
  let row: Measures[] = [];
  let currentWidth = 0;
  let totalHeight = 0; // Initialize total height
  let rowNumber = 1; // Initialize row number

  function finalizeRow() {
    // Calculate the height of the row based on the width and max height
    const height =
      viewportWidth < currentWidth
        ? (viewportWidth / currentWidth) * max_height
        : max_height;

    let left = 0;
    for (let i = 0; i < row.length; i++) {
      const item = row[i];
      const width = (height / item.height) * item.width;

      row[i].width = width;
      row[i].height = height;
      row[i].top = totalHeight;
      row[i].left = left;

      row[i].index = i; // Update index in the row
      row[i].totalItemsInRow = row.length; // Update total images in the row
      left += width;
    }

    rows = rows.concat(row);
    totalHeight += height;
    row = [];
    currentWidth = 0;
    rowNumber += 1; // Increment row number
  }

  items.forEach((item) => {
    row.push({
      width: item.width,
      height: item.height,
      top: 0,
      left: 0,

      index: 0, // Placeholder, will be updated while finalizing
      rowNo: rowNumber,
      totalItemsInRow: 0, // Placeholder, will be updated while finalizing
    });
    currentWidth += (max_height / item.height) * item.width;

    // If current width exceeds viewport, finalize the row
    if (currentWidth >= viewportWidth) finalizeRow();
  });

  if (row.length > 0) finalizeRow();

  return [rows, totalHeight, rowNumber] as const;
}

/**
 * Calculates the masonry layout for a set of items within a given viewport width.
 * @param viewportWidth - The width of the container in which the items will be laid out.
 * @param items - An array of items to be laid out, each with width and height properties.
 * @param targetHeight - The desired height for each row in the layout.
 * @param scaleFactor - A factor to allow rows to deviate from the target height.
 *
 * @returns [Measures[], totalHeight, rowCount]
 */
export function calculateJustifiedMasonryLayout({
  viewportWidth,
  items,
  targetHeight,
  scaleFactor = 0.1,
}: {
  viewportWidth: number;
  items: GridItemProps[];
  targetHeight: number;
  scaleFactor?: number;
}): [Measures[], number, number] {
  const min_height = targetHeight * (1 - scaleFactor);
  // const max_height = targetHeight * (1 + scaleFactor);
  // const MAX_TOLERANCE = targetHeight * 1.35;

  const count = items.length;
  const aspectRatios = items.map((item) => item.width / item.height);

  // dp[i] represents the minimum cost to arrange items[0..i-1]
  const dp = new Array(count + 1).fill(Infinity);
  dp[0] = 0;

  // parent[i] stores the starting index of the row that ends at i
  // This is used to reconstruct the layout later
  const parent = new Array(count + 1).fill(0);

  for (let i = 1; i <= count; i++) {
    let currentAspectRatioSum = 0;

    // Look back at previous items to find the best break point
    for (let j = i - 1; j >= 0; j--) {
      currentAspectRatioSum += aspectRatios[j];
      const rowHeight = viewportWidth / currentAspectRatioSum;

      // As we add more items (decreasing j), the rowHeight gets smaller.
      // If it's already smaller than min_height, adding more items will only
      // make it worse (shorter). So we can stop looking back.
      if (rowHeight < min_height) {
        // However! If this is the very first item we are checking (j === i-1),
        // we must accept it, otherwise we might end up with NO valid path
        // if a single panorama is naturally shorter than min_height.
        if (j !== i - 1) break;
      }

      // If a row is too tall, the squared cost will naturally be high,
      // but it will still be selectable if it's the only option.
      let cost = (rowHeight - targetHeight) ** 2;

      // Orphan Penalty
      // We generally dislike rows with only 1 item, unless that item is naturally wide.
      // If the row has 1 item and it's making the row tall (> target), add a penalty.
      if (i - j === 1 && rowHeight > targetHeight)
        cost += targetHeight ** 2 * 2;

      // Total cost if we break the row here
      // This includes the cost up to the previous item plus the cost of the current row
      const totalCost = dp[j] + cost;

      // Update dp and parent if we found a new minimum cost
      if (totalCost < dp[i]) {
        dp[i] = totalCost;
        parent[i] = j;
      }
    }

    // Fallback for safety against Infinity
    if (dp[i] === Infinity) {
      parent[i] = i - 1;
      dp[i] = dp[i - 1] + (targetHeight * 10) ** 2;
    }
  }

  const measures: Measures[] = new Array(count);
  const rows: { start: number; end: number; height: number }[] = [];

  // Backtrack from the last item to finding row breaks
  let curr = count;
  while (curr > 0) {
    const start = parent[curr];

    // Recalculate the exact height for this final decided row
    let rowAspectRatioSum = 0;
    for (let k = start; k < curr; k++) rowAspectRatioSum += aspectRatios[k];

    const exactRowHeight = viewportWidth / rowAspectRatioSum;
    // if (exactRowHeight > MAX_TOLERANCE) exactRowHeight = MAX_TOLERANCE;

    rows.unshift({ start, end: curr, height: exactRowHeight });
    curr = start;
  }

  // Generate Measures
  let currentTop = 0;

  rows.forEach((row, rowIndex) => {
    let currentLeft = 0;
    const itemsInRow = row.end - row.start;

    for (let k = row.start; k < row.end; k++) {
      const itemWidth = aspectRatios[k] * row.height;

      measures[k] = {
        width: itemWidth,
        height: row.height,
        top: currentTop,
        left: currentLeft,
        index: k - row.start,
        rowNo: rowIndex + 1,
        totalItemsInRow: itemsInRow,
      };

      currentLeft += itemWidth;
    }

    currentTop += row.height;
  });

  return [measures, currentTop, rows.length];
}
