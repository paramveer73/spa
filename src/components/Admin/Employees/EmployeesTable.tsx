import { useMemo, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { DataGrid, GridActionsCellItem, type GridCellParams, type GridColDef } from "@mui/x-data-grid";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import { DEFAULT_ROLE, workloadByEmployee, type EmployeeDraft, type StaffMember, type Workload } from "./employeeDraft";
import EmployeeDialog from "./EmployeeDialog";
import {
    ADMIN_GRID_SX,
    DEFAULT_PAGE_SIZE,
    PAGE_SIZE_OPTIONS,
    ProfessionalTag,
    ScreenHeader,
    adminGridSlotProps,
    useDialogTarget,
    useNow,
} from "../AdminTable";
import type { Booking } from "../Bookings";
import ConfirmDialog from "../ConfirmDialog";
import type { OpenSlot } from "../FreeSlots";
import NoticeSnackbar, { type Notice } from "../NoticeSnackbar";

export interface EmployeesTableProps {
    employees: StaffMember[];
    /** Open slots and bookings, only to count what each person has coming up. */
    slots: OpenSlot[];
    bookings: Booking[];
    /** `id` null adds a new professional. Rejecting keeps the dialog open with the error. */
    onSaveEmployee: (draft: EmployeeDraft, id: string | null) => Promise<void>;
    onDeleteEmployee: (id: string) => Promise<void>;
}

const NO_WORKLOAD: Workload = { openSlots: 0, upcomingBookings: 0 };
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const loadOf = (workload: Map<string, Workload>, id: string) => workload.get(id) ?? NO_WORKLOAD;

/** "3 open slots and 2 upcoming bookings", leaving out whichever is zero. */
function workloadSummary({ openSlots, upcomingBookings }: Workload): string {
    const parts = [];
    if (openSlots) parts.push(plural(openSlots, "open slot"));
    if (upcomingBookings) parts.push(plural(upcomingBookings, "upcoming booking"));
    return parts.join(" and ");
}

/**
 * The team, with what each person has coming up. Adding and editing happen in
 * a dialog; deleting says exactly what the person still has on the calendar
 * before it goes ahead.
 */
export default function EmployeesTable({
    employees,
    slots,
    bookings,
    onSaveEmployee,
    onDeleteEmployee,
}: EmployeesTableProps) {
    const now = useNow();
    const [notice, setNotice] = useState<Notice | null>(null);
    // `null` as the target means "adding someone new".
    const editor = useDialogTarget<StaffMember | null>();
    const deletion = useDialogTarget<StaffMember>();

    const workload = useMemo(() => workloadByEmployee(slots, bookings, now), [slots, bookings, now]);

    const handleCellClick = (params: GridCellParams<StaffMember>) => {
        if (params.field !== "actions") editor.show(params.row);
    };

    const handleSave = async (draft: EmployeeDraft) => {
        const editing = editor.target;
        await onSaveEmployee(draft, editing?.id ?? null);
        const name = draft.name.trim();
        setNotice({ severity: "success", message: editing ? `Saved changes to ${name}.` : `Added ${name} to the team.` });
    };

    const handleConfirmDelete = async () => {
        const member = deletion.target;
        if (!member) return;
        await onDeleteEmployee(member.id);
        setNotice({ severity: "success", message: `Removed ${member.name} from the team.` });
    };

    const columns = useMemo<GridColDef<StaffMember>[]>(
        () => [
            {
                field: "name",
                headerName: "Professional",
                flex: 1.2,
                minWidth: 190,
                renderCell: ({ row }) => <ProfessionalTag name={row.name} color={row.color} />,
            },
            {
                field: "role",
                headerName: "Role",
                flex: 1,
                minWidth: 150,
                valueGetter: (value: string | undefined) => value || DEFAULT_ROLE,
            },
            {
                field: "openSlots",
                headerName: "Open slots",
                type: "number",
                width: 120,
                valueGetter: (_value, row) => loadOf(workload, row.id).openSlots,
            },
            {
                field: "upcomingBookings",
                headerName: "Upcoming bookings",
                type: "number",
                width: 170,
                valueGetter: (_value, row) => loadOf(workload, row.id).upcomingBookings,
            },
            {
                field: "color",
                headerName: "Colour",
                width: 120,
                renderCell: ({ value }) => (
                    <Typography component="span" variant="body2" sx={{ fontFamily: "monospace", color: "text.secondary" }}>
                        {value}
                    </Typography>
                ),
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
        [workload, editor.show, deletion.show],
    );

    const target = deletion.target;
    const targetLoad = target ? loadOf(workload, target.id) : NO_WORKLOAD;
    const hasWork = targetLoad.openSlots + targetLoad.upcomingBookings > 0;

    return (
        <Box>
            {/* 1. Header */}
            <ScreenHeader
                title="Team"
                description="The professionals clients can book. Their colour marks their slots on the calendar. Click a row to edit."
                action={
                    <Button
                        variant="contained"
                        startIcon={<PersonAddAlt1OutlinedIcon />}
                        onClick={() => editor.show(null)}
                        sx={{ borderRadius: 2, fontWeight: 700 }}
                    >
                        Add professional
                    </Button>
                }
            />

            {/* 2. Table */}
            <DataGrid
                rows={employees}
                columns={columns}
                label="Team"
                showToolbar
                autoHeight
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                initialState={{
                    pagination: { paginationModel: { pageSize: DEFAULT_PAGE_SIZE } },
                    sorting: { sortModel: [{ field: "name", sort: "asc" }] },
                }}
                onCellClick={handleCellClick}
                disableRowSelectionOnClick
                localeText={{ noRowsLabel: "No professionals yet. Add the first one.", noResultsOverlayLabel: "No one matches that search" }}
                slotProps={adminGridSlotProps("team")}
                sx={{ ...ADMIN_GRID_SX, "& .MuiDataGrid-row": { cursor: "pointer" } }}
            />

            {/* 3. Dialogs */}
            <EmployeeDialog
                open={editor.open}
                employee={editor.target}
                employees={employees}
                onClose={editor.close}
                onSave={handleSave}
            />

            <ConfirmDialog
                open={deletion.open}
                title={target ? `Remove ${target.name}?` : "Remove professional?"}
                confirmLabel="Remove"
                pendingLabel="Removing…"
                onConfirm={handleConfirmDelete}
                onClose={deletion.close}
            >
                {target && (
                    <Typography variant="body2" sx={{ color: hasWork ? "text.primary" : "text.secondary" }}>
                        {hasWork ? (
                            <>
                                {target.name} still has <strong>{workloadSummary(targetLoad)}</strong>. Those stay on the
                                calendar as &ldquo;Removed professional&rdquo;, and nothing is reassigned automatically.
                            </>
                        ) : (
                            <>{target.name} has nothing coming up, so the calendar won&apos;t change.</>
                        )}
                    </Typography>
                )}
            </ConfirmDialog>

            <NoticeSnackbar notice={notice} onClose={() => setNotice(null)} />
        </Box>
    );
}
