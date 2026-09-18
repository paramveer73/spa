import { useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import {
    DataGrid,
    GridActionsCellItem,
    type GridCellParams,
    type GridColDef,
    type GridSortModel,
} from "@mui/x-data-grid";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import type { Employee } from "@/components/calendar";
import { ALL_PROFESSIONALS, effectiveProfessionalFilter } from "@/utils/employees";
import { formatDate, formatTime } from "@/utils/format";
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
import BookingDetailDialog from "./BookingDetailDialog";
import { bookingOwner, bookingsForProfessional, type Booking } from "./bookings";

export interface BookingsTableProps {
    bookings: Booking[];
    employees: Employee[];
    loading: boolean;
    /** Rejecting keeps the confirm dialog open with the error. */
    onCancelBooking: (booking: Booking) => Promise<void>;
}

// Upcoming reads soonest-first; past reads most-recent-first.
const sortFor = (timeframe: TimeframeFilter): GridSortModel => [
    { field: "start", sort: timeframe === "past" ? "desc" : "asc" },
];

const clientName = (booking: Booking) => booking.name || "this client";

/**
 * Every booked appointment in one searchable, sortable table. Filters sit
 * above the grid (timeframe, professional); the grid's own toolbar adds the
 * free-text search, column filters and CSV export. Clicking a row opens the
 * full booking.
 */
export default function BookingsTable({ bookings, employees, loading, onCancelBooking }: BookingsTableProps) {
    const now = useNow();
    const [timeframe, setTimeframe] = useState<TimeframeFilter>("upcoming");
    const [professional, setProfessional] = useState(ALL_PROFESSIONALS);
    const [sortModel, setSortModel] = useState<GridSortModel>(() => sortFor("upcoming"));
    const [notice, setNotice] = useState<Notice | null>(null);
    const details = useDialogTarget<Booking>();
    const cancellation = useDialogTarget<Booking>();

    const professionalFilter = effectiveProfessionalFilter(professional, employees);
    const scoped = useMemo(() => bookingsForProfessional(bookings, professionalFilter), [bookings, professionalFilter]);
    const counts = useMemo(() => countByTimeframe(scoped, now), [scoped, now]);
    const rows = useMemo(() => filterByTimeframe(scoped, timeframe, now), [scoped, timeframe, now]);

    const handleTimeframeChange = (next: TimeframeFilter) => {
        setTimeframe(next);
        setSortModel(sortFor(next));
    };

    const handleCellClick = (params: GridCellParams<Booking>) => {
        // The actions column has its own buttons; a click there isn't "open".
        if (params.field !== "actions") details.show(params.row);
    };

    const handleRequestCancel = (booking: Booking) => {
        details.close();
        cancellation.show(booking);
    };

    const handleConfirmCancel = async () => {
        const booking = cancellation.target;
        if (!booking) return;
        await onCancelBooking(booking);
        setNotice({ severity: "success", message: `Cancelled ${clientName(booking)}'s booking.` });
    };

    const columns = useMemo<GridColDef<Booking>[]>(
        () => [
            {
                field: "start",
                headerName: "When",
                type: "dateTime",
                flex: 1.2,
                minWidth: 230,
                // Also what the quick search matches, so "sep 14" or "fri" finds rows.
                valueFormatter: (_value, row) => formatWhen(row.start, row.end),
                renderCell: ({ row }) => <WhenCell start={row.start} end={row.end} />,
            },
            { field: "name", headerName: "Client", flex: 1, minWidth: 150 },
            { field: "email", headerName: "Email", flex: 1.2, minWidth: 190 },
            { field: "phone", headerName: "Phone", minWidth: 140 },
            {
                field: "professional",
                headerName: "Professional",
                flex: 1,
                minWidth: 170,
                valueGetter: (_value, row) => bookingOwner(employees, row).name,
                renderCell: ({ row }) => <ProfessionalTag {...bookingOwner(employees, row)} />,
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
                width: 96,
                getActions: ({ row }) => [
                    <GridActionsCellItem
                        key="view"
                        icon={<VisibilityOutlinedIcon />}
                        label="View booking"
                        onClick={() => details.show(row)}
                    />,
                    <GridActionsCellItem
                        key="cancel"
                        icon={<EventBusyOutlinedIcon />}
                        label="Cancel booking"
                        disabled={timeStatus(row.start, row.end, now) === "past"}
                        onClick={() => cancellation.show(row)}
                    />,
                ],
            },
        ],
        [employees, now, details.show, cancellation.show],
    );

    const emptyLabel = timeframe === "all" ? "No bookings yet" : `No ${TIMEFRAME_LABELS[timeframe].toLowerCase()} bookings`;
    const target = cancellation.target;

    return (
        <Box>
            {/* 1. Header */}
            <ScreenHeader
                title="Bookings"
                description="Every appointment clients have booked. Search by name, email, phone or date, and click a row for the full booking."
            />

            {/* 2. Filters */}
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, mb: 2 }}>
                <TimeframeToggle value={timeframe} onChange={handleTimeframeChange} counts={counts} />
                <ProfessionalSelect employees={employees} value={professionalFilter} onChange={setProfessional} />
            </Box>

            {/* 3. Table */}
            <DataGrid
                rows={rows}
                columns={columns}
                loading={loading}
                label="Bookings"
                showToolbar
                autoHeight
                rowHeight={ADMIN_ROW_HEIGHT}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                initialState={{ pagination: { paginationModel: { pageSize: DEFAULT_PAGE_SIZE } } }}
                sortModel={sortModel}
                onSortModelChange={setSortModel}
                onCellClick={handleCellClick}
                disableRowSelectionOnClick
                localeText={{ noRowsLabel: emptyLabel, noResultsOverlayLabel: "No bookings match that search" }}
                slotProps={adminGridSlotProps("bookings")}
                sx={{ ...ADMIN_GRID_SX, "& .MuiDataGrid-row": { cursor: "pointer" } }}
            />

            {/* 4. Dialogs */}
            <BookingDetailDialog
                open={details.open}
                booking={details.target}
                employees={employees}
                now={now}
                onClose={details.close}
                onCancelBooking={handleRequestCancel}
            />

            <ConfirmDialog
                open={cancellation.open}
                title="Cancel this booking?"
                confirmLabel="Cancel booking"
                pendingLabel="Cancelling…"
                onConfirm={handleConfirmCancel}
                onClose={cancellation.close}
            >
                {target && (
                    <>
                        <Typography variant="body2" sx={{ mb: 1.5 }}>
                            <strong>{clientName(target)}</strong> on {formatDate(target.start)} at {formatTime(target.start)}{" "}
                            with {bookingOwner(employees, target).name}.
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            The booking is deleted and the time doesn&apos;t go back on the calendar. Publish it again from
                            Schedule if you want it rebooked.
                        </Typography>
                    </>
                )}
            </ConfirmDialog>

            <NoticeSnackbar notice={notice} onClose={() => setNotice(null)} />
        </Box>
    );
}
