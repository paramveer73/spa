import { brand } from "@/data/brand";

/**
 * Settings every admin DataGrid shares, so the three tables page, search,
 * export and load the same way.
 */

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 25;

/** Room for the two-line date cell. */
export const ADMIN_ROW_HEIGHT = 60;

export const ADMIN_GRID_SX = {
    bgcolor: "background.paper",
    borderRadius: 3,
    p: 2,
    "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700 },
} as const;

/** Toolbar + loading overlay slot props. The CSV export is named `<brand slug>-<exportName>`. */
export function adminGridSlotProps(exportName: string) {
    return {
        toolbar: {
            csvOptions: { fileName: `${brand.slug}-${exportName}`, utf8WithBom: true },
            // Print renders the grid's current page only, which reads as a
            // complete list when it isn't. CSV exports every filtered row.
            printOptions: { disableToolbarButton: true },
        },
        loadingOverlay: { variant: "skeleton", noRowsVariant: "skeleton" },
    } as const;
}
