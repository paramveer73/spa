import { useMemo, useState } from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import {
    DataGrid,
    GridActionsCellItem,
    type GridColDef,
    type GridRowSelectionModel,
} from "@mui/x-data-grid";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import type { Employee } from "@/components/calendar";
import { ALL_PROFESSIONALS, describeOwner, effectiveProfessionalFilter } from "@/utils/employees";
import { formatDuration } from "@/utils/format";
import {
    TIME_STATUS_LABELS,
    TIMEFRAME_LABELS,
    countByTimeframe,
    filterByTimeframe,
    timeStatus,
    type TimeframeFilter,
    type TimeStatus,
} from "@/utils/timeframe";
import {
    ADMIN_GRID_SX,
    ADMIN_ROW_HEIGHT,
    DEFAULT_PAGE_SIZE,
    PAGE_SIZE_OPTIONS,
    ProfessionalSelect,
    ProfessionalTag,
    STATUS_RANK,
    ScreenHeader,
    StatusChip,
    TimeframeToggle,
    WhenCell,
    adminGridSlotProps,
    formatWhen,
    useDialogTarget,
    useNow,
} from "../AdminTable";
import ConfirmDialog from "../ConfirmDialog";
import NoticeSnackbar, { type Notice } from "../NoticeSnackbar";
import { scopeFreeSlots, type OpenSlot } from "./freeSlots";

export interface FreeSlotsTableProps {
    slots: OpenSlot[];
    employees: Employee[];
    loading: boolean;
    /** Deletes in one atomic write. Rejecting keeps the confirm dialog open with the error. */
    onDeleteSlots: (slots: OpenSlot[]) => Promise<void>;
}

const EMPTY_SELECTION: GridRowSelectionModel = { type: "include", ids: new Set() };
/** How many slots the delete confirmation lists before summarising the rest. */
const CONFIRM_PREVIEW = 6;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * Every slot clients can still book, for tidying the calendar in bulk: narrow
 * by timeframe, professional or dates, tick rows, delete them in one go. Past
 * open slots were never booked — the Past filter is the place to clear them.
 */
export default function FreeSlotsTable({ slots, employees, loading, onDeleteSlots }: FreeSlotsTableProps) {
    const now = useNow();
    const [timeframe, setTimeframe] = useState<TimeframeFilter>("upcoming");
    const [professional, setProfessional] = useState(ALL_PROFESSIONALS);
    const [from, setFrom] = useState<Date | null>(null);
    const [to, setTo] = useState<Date | null>(null);
    const [selection, setSelection] = useState<GridRowSelectionModel>(EMPTY_SELECTION);
    const [notice, setNotice] = useState<Notice | null>(null);
    const deletion = useDialogTarget<OpenSlot[]>();

    const professionalFilter = effectiveProfessionalFilter(professional, employees);
    const scoped = useMemo(
        () => scopeFreeSlots(slots, professionalFilter, from, to),
        [slots, professionalFilter, from, to],
    );
    const counts = useMemo(() => countByTimeframe(scoped, now), [scoped, now]);
    const rows = useMemo(() => filterByTimeframe(scoped, timeframe, now), [scoped, timeframe, now]);

    // Resolved against the rows on screen, so a slot that has since been
    // booked (and left the list) can't be carried into a delete.
    const selected = useMemo(() => rows.filter((slot) => selection.ids.has(slot.id)), [rows, selection]);
    const filtersActive = professionalFilter !== ALL_PROFESSIONALS || from !== null || to !== null;

    const handleClearFilters = () => {
        setProfessional(ALL_PROFESSIONALS);
        setFrom(null);
        setTo(null);
    };

    const handleConfirmDelete = async () => {
        const doomed = deletion.target ?? [];
        await onDeleteSlots(doomed);
        const gone = new Set(doomed.map((slot) => slot.id));
        setSelection((current) => ({
            type: "include",
            ids: new Set([...current.ids].filter((id) => !gone.has(String(id)))),
        }));
        setNotice({ severity: "success", message: `Deleted ${plural(doomed.length, "open slot")}.` });
    };

    const columns = useMemo<GridColDef<OpenSlot>[]>(
        () => [
            {
                field: "start",
                headerName: "When",
                type: "dateTime",
                flex: 1.2,
                minWidth: 230,
                // Also what the quick search matches, so "sep 14" or "fri" finds rows.
                valueFormatter: (_value, row) => formatWhen(row.start, row.end),
                // Length has its own column here (filterable: "every 15-minute slot").
                renderCell: ({ row }) => <WhenCell start={row.start} end={row.end} showDuration={false} />,
            },
            {
                field: "durationMinutes",
                headerName: "Length",
                type: "number",
                width: 110,
                align: "left",
                headerAlign: "left",
                valueFormatter: (value: number) => formatDuration(value),
            },
            {
                field: "professional",
                headerName: "Professional",
                flex: 1,
                minWidth: 170,
                valueGetter: (_value, row) => describeOwner(employees, row.employeeId).name,
                renderCell: ({ row }) => <ProfessionalTag {...describeOwner(employees, row.employeeId)} />,
            },
            {
                field: "status",
                headerName: "Status",
                width: 120,
                valueGetter: (_value, row) => timeStatus(row.start, row.end, now),
                valueFormatter: (value: TimeStatus) => TIME_STATUS_LABELS[value],
                sortComparator: (a: TimeStatus, b: TimeStatus) => STATUS_RANK[a] - STATUS_RANK[b],
                renderCell: ({ row }) => <StatusChip status={timeStatus(row.start, row.end, now)} />,
            },
            {
                field: "actions",
                type: "actions",
                width: 64,
                getActions: ({ row }) => [
                    <GridActionsCellItem
                        key="delete"
                        icon={<DeleteOutlineIcon />}
                        label="Delete slot"
                        onClick={() => deletion.show([row])}
                    />,
                ],
            },
        ],
        [employees, now, deletion.show],
    );

    const emptyLabel = timeframe === "all" ? "No open slots" : `No ${TIMEFRAME_LABELS[timeframe].toLowerCase()} open slots`;
    // Listed in time order: the selection is in data order, not the grid's sort.
    const doomed = useMemo(
        () => [...(deletion.target ?? [])].sort((a, b) => a.start.getTime() - b.start.getTime()),
        [deletion.target],
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box>
                {/* 1. Header */}
                <ScreenHeader
                    title="Open slots"
                    description="Times clients can still book. Narrow the list, tick the slots you don't want, and delete them together."
                />

                {/* 2. Filters */}
                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, mb: 2 }}>
                    <TimeframeToggle value={timeframe} onChange={setTimeframe} counts={counts} />
                    <ProfessionalSelect employees={employees} value={professionalFilter} onChange={setProfessional} />
                    <DatePicker
                        label="From"
                        value={from}
                        onChange={setFrom}
                        maxDate={to ?? undefined}
                        slotProps={{ textField: { size: "small", sx: { width: 170 } }, field: { clearable: true } }}
                    />
                    <DatePicker
                        label="To"
                        value={to}
                        onChange={setTo}
                        minDate={from ?? undefined}
                        slotProps={{ textField: { size: "small", sx: { width: 170 } }, field: { clearable: true } }}
                    />
                    {filtersActive && (
                        <Button onClick={handleClearFilters} color="inherit" size="small">
                            Clear filters
                        </Button>
                    )}
                </Box>

                {/* 3. Bulk actions — only while something is ticked */}
                {selected.length > 0 && (
                    <Paper
                        variant="outlined"
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            gap: 1.5,
                            px: 2,
                            py: 1,
                            mb: 2,
                            borderRadius: 2,
                            bgcolor: "action.hover",
                        }}
                    >
                        <Typography variant="body2" sx={{ fontWeight: 700, flexGrow: 1 }}>
                            {plural(selected.length, "slot")} selected
                        </Typography>
                        <Button size="small" color="inherit" onClick={() => setSelection(EMPTY_SELECTION)}>
                            Clear
                        </Button>
                        <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<DeleteOutlineIcon />}
                            onClick={() => deletion.show(selected)}
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                            Delete {plural(selected.length, "slot")}
                        </Button>
                    </Paper>
                )}

                {/* 4. Table */}
                <DataGrid
                    rows={rows}
                    columns={columns}
                    loading={loading}
                    label="Open slots"
                    showToolbar
                    autoHeight
                    rowHeight={ADMIN_ROW_HEIGHT}
                    pageSizeOptions={PAGE_SIZE_OPTIONS}
                    initialState={{
                        pagination: { paginationModel: { pageSize: DEFAULT_PAGE_SIZE } },
                        sorting: { sortModel: [{ field: "start", sort: "asc" }] },
                    }}
                    checkboxSelection
                    disableRowSelectionOnClick
                    // Select-all normally yields { type: "exclude", ids: ∅ } —
                    // "everything but nothing" — which reads as zero selected
                    // to anything that just looks at `ids`. Always get the ids.
                    disableRowSelectionExcludeModel
                    rowSelectionModel={selection}
                    onRowSelectionModelChange={setSelection}
                    localeText={{ noRowsLabel: emptyLabel, noResultsOverlayLabel: "No open slots match that search" }}
                    slotProps={adminGridSlotProps("open-slots")}
                    sx={ADMIN_GRID_SX}
                />

                {/* 5. Dialogs */}
                <ConfirmDialog
                    open={deletion.open}
                    title={doomed.length === 1 ? "Delete this open slot?" : `Delete ${doomed.length} open slots?`}
                    confirmLabel={`Delete ${plural(doomed.length, "slot")}`}
                    pendingLabel="Deleting…"
                    onConfirm={handleConfirmDelete}
                    onClose={deletion.close}
                >
                    <Typography variant="body2" sx={{ mb: 1.5 }}>
                        Clients won&apos;t be able to book {doomed.length === 1 ? "it" : "them"} any more. Booked appointments
                        aren&apos;t affected.
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2.5, color: "text.secondary" }}>
                        {doomed.slice(0, CONFIRM_PREVIEW).map((slot) => (
                            <Typography component="li" variant="body2" key={slot.id}>
                                {formatWhen(slot.start, slot.end)} · {describeOwner(employees, slot.employeeId).name}
                            </Typography>
                        ))}
                        {doomed.length > CONFIRM_PREVIEW && (
                            <Typography component="li" variant="body2">
                                and {doomed.length - CONFIRM_PREVIEW} more
                            </Typography>
                        )}
                    </Box>
                </ConfirmDialog>

                <NoticeSnackbar notice={notice} onClose={() => setNotice(null)} />
            </Box>
        </LocalizationProvider>
    );
}
