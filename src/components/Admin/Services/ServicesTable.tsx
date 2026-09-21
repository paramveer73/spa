import { useMemo, useState } from "react";
import { Box, Button, Chip, Tooltip, Typography } from "@mui/material";
import { DataGrid, GridActionsCellItem, type GridCellParams, type GridColDef } from "@mui/x-data-grid";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import { categoryPaths, type CategoryRecord, type ServiceRecord } from "@/data/catalog";
import { formatDuration, formatPrice } from "@/utils/format";
import {
    ADMIN_GRID_SX,
    DEFAULT_PAGE_SIZE,
    PAGE_SIZE_OPTIONS,
    ScreenHeader,
    adminGridSlotProps,
    useDialogTarget,
} from "../AdminTable";
import ConfirmDialog from "../ConfirmDialog";
import NoticeSnackbar, { type Notice } from "../NoticeSnackbar";
import ServiceDialog from "./ServiceDialog";
import type { ServiceDraft } from "./serviceDraft";

export interface ServicesTableProps {
    services: ServiceRecord[];
    categories: CategoryRecord[];
    loading: boolean;
    /** `editing` null adds a new service. Rejecting keeps the dialog open with the error. */
    onSaveService: (draft: ServiceDraft, editing: ServiceRecord | null) => Promise<void>;
    onDeleteService: (id: string) => Promise<void>;
}

const NO_CATEGORY = "No category — not on the menu";

/**
 * Every service on the booking menu, in menu order. Adding and editing happen
 * in a dialog; each save reaches the booking page as soon as it's written.
 */
export default function ServicesTable({ services, categories, loading, onSaveService, onDeleteService }: ServicesTableProps) {
    const [notice, setNotice] = useState<Notice | null>(null);
    // `null` as the target means "adding a new service".
    const editor = useDialogTarget<ServiceRecord | null>();
    const deletion = useDialogTarget<ServiceRecord>();

    const paths = useMemo(() => categoryPaths(categories), [categories]);
    const labels = useMemo(() => new Map(paths.map((path) => [path.id, path.label])), [paths]);

    // Rows in the order clients see them: by category as the menu lists
    // categories, then by position within each. Services whose category is
    // missing sort last, where they're easy to spot and move.
    const rows = useMemo(() => {
        const rank = new Map(paths.map((path, index) => [path.id, index]));
        const rankOf = (service: ServiceRecord) => rank.get(service.categoryId) ?? paths.length;
        return [...services].sort((a, b) => rankOf(a) - rankOf(b) || Number(a.addOn) - Number(b.addOn) || a.order - b.order);
    }, [services, paths]);

    const handleCellClick = (params: GridCellParams<ServiceRecord>) => {
        if (params.field !== "actions") editor.show(params.row);
    };

    const handleSave = async (draft: ServiceDraft) => {
        const editing = editor.target;
        await onSaveService(draft, editing);
        const name = draft.name.trim();
        setNotice({ severity: "success", message: editing ? `Saved changes to ${name}.` : `Added ${name} to the menu.` });
    };

    const handleConfirmDelete = async () => {
        const service = deletion.target;
        if (!service) return;
        await onDeleteService(service.id);
        setNotice({ severity: "success", message: `Removed ${service.name} from the menu.` });
    };

    const columns = useMemo<GridColDef<ServiceRecord>[]>(
        () => [
            {
                field: "name",
                headerName: "Service",
                flex: 1.6,
                minWidth: 220,
                renderCell: ({ row }) => (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                        <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                            {row.name}
                        </Box>
                        {row.addOn && <Chip size="small" label="Add-on" variant="outlined" />}
                        {row.note && (
                            <Tooltip title={row.note}>
                                <StickyNote2OutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} aria-label="Has an internal note" />
                            </Tooltip>
                        )}
                    </Box>
                ),
            },
            {
                field: "category",
                headerName: "Category",
                flex: 1.2,
                minWidth: 200,
                valueGetter: (_value, row) => labels.get(row.categoryId) ?? NO_CATEGORY,
                renderCell: ({ value }) => (
                    <Typography
                        component="span"
                        variant="body2"
                        sx={{ color: value === NO_CATEGORY ? "warning.main" : "text.secondary" }}
                    >
                        {value}
                    </Typography>
                ),
            },
            {
                field: "price",
                headerName: "Price",
                type: "number",
                width: 110,
                valueFormatter: (value: number) => formatPrice(value),
            },
            {
                field: "duration",
                headerName: "Length",
                type: "number",
                width: 130,
                valueFormatter: (value: number) => formatDuration(value),
            },
            {
                field: "actions",
                type: "actions",
                width: 96,
                getActions: ({ row }) => [
                    <GridActionsCellItem key="edit" icon={<EditOutlinedIcon />} label={`Edit ${row.name}`} onClick={() => editor.show(row)} />,
                    <GridActionsCellItem
                        key="delete"
                        icon={<DeleteOutlineIcon />}
                        label={`Remove ${row.name}`}
                        onClick={() => deletion.show(row)}
                    />,
                ],
            },
        ],
        [labels, editor.show, deletion.show],
    );

    const target = deletion.target;

    return (
        <Box>
            {/* 1. Header */}
            <ScreenHeader
                title="Services"
                description="The booking menu. Changes show on the booking page as soon as they're saved. Click a row to edit."
                action={
                    <Button
                        variant="contained"
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={() => editor.show(null)}
                        disabled={categories.length === 0}
                        sx={{ borderRadius: 2, fontWeight: 700 }}
                    >
                        Add service
                    </Button>
                }
            />

            {/* 2. Table */}
            <DataGrid
                rows={rows}
                columns={columns}
                loading={loading}
                label="Services"
                showToolbar
                autoHeight
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                initialState={{ pagination: { paginationModel: { pageSize: DEFAULT_PAGE_SIZE } } }}
                onCellClick={handleCellClick}
                disableRowSelectionOnClick
                localeText={{
                    noRowsLabel: "The menu is empty. Import the catalog, or add the first service.",
                    noResultsOverlayLabel: "No service matches that search",
                }}
                slotProps={adminGridSlotProps("services")}
                sx={{ ...ADMIN_GRID_SX, "& .MuiDataGrid-row": { cursor: "pointer" } }}
            />

            {/* 3. Dialogs */}
            <ServiceDialog
                open={editor.open}
                service={editor.target}
                services={services}
                categories={categories}
                onClose={editor.close}
                onSave={handleSave}
            />

            <ConfirmDialog
                open={deletion.open}
                title={target ? `Remove ${target.name}?` : "Remove service?"}
                confirmLabel="Remove"
                pendingLabel="Removing…"
                onConfirm={handleConfirmDelete}
                onClose={deletion.close}
            >
                {target && (
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {target.name} ({formatPrice(target.price)}, {formatDuration(target.duration)}) comes off the booking
                        menu straight away. Adding it back later makes it a new service.
                    </Typography>
                )}
            </ConfirmDialog>

            <NoticeSnackbar notice={notice} onClose={() => setNotice(null)} />
        </Box>
    );
}
