import { useMemo, useState, type ChangeEvent } from "react";
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    ButtonBase,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    DEFAULT_ROLE,
    NAME_MAX,
    TEAM_PALETTE,
    checkEmployeeDraft,
    colourOwners,
    draftFromEmployee,
    isDraftChanged,
    normalizeHex,
    type EmployeeDraft,
    type StaffMember,
} from "./employeeDraft";

export interface EmployeeDialogProps {
    open: boolean;
    /** The professional being edited; null adds a new one. */
    employee: StaffMember | null;
    employees: StaffMember[];
    onClose: () => void;
    /** Rejecting keeps the dialog open with the error. */
    onSave: (draft: EmployeeDraft) => Promise<void>;
}

const SWATCH = 30;

/** Add or edit one professional: name, role, and the colour their slots wear on the calendar. */
export default function EmployeeDialog({ open, employee, employees, onClose, onSave }: EmployeeDialogProps) {
    const [draft, setDraft] = useState<EmployeeDraft>(() => draftFromEmployee(employee, employees));
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [wasOpen, setWasOpen] = useState(open);

    // Each open starts from the record (or a fresh draft), not the last edit.
    // Reset during render rather than in an effect, which would paint one
    // frame of the previous draft first. Only on opening: a teammate's change
    // arriving over the listener mustn't wipe what's being typed.
    if (open !== wasOpen) {
        setWasOpen(open);
        if (open) {
            setDraft(draftFromEmployee(employee, employees));
            setError(null);
        }
    }

    const check = checkEmployeeDraft(draft, employees, employee?.id ?? null);
    const changed = isDraftChanged(draft, employee);
    const owners = useMemo(() => colourOwners(employees), [employees]);
    const roles = useMemo(
        () => [...new Set([DEFAULT_ROLE, ...employees.map((member) => member.role).filter((role): role is string => !!role)])],
        [employees],
    );
    const selectedHex = normalizeHex(draft.color);

    const handleChange = (field: keyof EmployeeDraft) => (value: string) =>
        setDraft((current) => ({ ...current, [field]: value }));

    const handleSave = async () => {
        setPending(true);
        setError(null);
        try {
            await onSave(draft);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setPending(false);
        }
    };

    return (
        <Dialog open={open} onClose={pending ? undefined : onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontWeight: 800 }}>{employee ? `Edit ${employee.name}` : "Add a professional"}</DialogTitle>

            <DialogContent dividers>
                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        Nothing was saved. {error}
                    </Alert>
                )}

                <Stack spacing={3}>
                    {/* 1. Name */}
                    <TextField
                        label="Name"
                        value={draft.name}
                        onChange={(event) => handleChange("name")(event.target.value)}
                        disabled={pending}
                        required
                        autoFocus
                        fullWidth
                        error={!!check.nameError && draft.name !== ""}
                        helperText={(draft.name !== "" && check.nameError) || check.nameWarning || " "}
                        slotProps={{
                            htmlInput: { maxLength: NAME_MAX },
                            formHelperText: { sx: { color: check.nameWarning && !check.nameError ? "warning.main" : undefined } },
                        }}
                    />

                    {/* 2. Role — free text, with the team's existing roles offered */}
                    <Autocomplete
                        freeSolo
                        options={roles}
                        inputValue={draft.role}
                        onInputChange={(_, value) => handleChange("role")(value)}
                        disabled={pending}
                        renderInput={(params) => (
                            <TextField {...params} label="Role" helperText={`Leave blank for "${DEFAULT_ROLE}".`} />
                        )}
                    />

                    {/* 3. Colour */}
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.25 }}>
                            Calendar colour
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
                            {TEAM_PALETTE.map((color) => {
                                const owner = owners.get(color);
                                const takenByOther = owner && owner.id !== employee?.id;
                                const isSelected = selectedHex === color;
                                return (
                                    <Tooltip key={color} title={takenByOther ? `Used by ${owner.name}` : "Available"}>
                                        <ButtonBase
                                            onClick={() => handleChange("color")(color)}
                                            disabled={pending}
                                            aria-label={`${color}${takenByOther ? `, used by ${owner.name}` : ""}`}
                                            aria-pressed={isSelected}
                                            sx={{
                                                width: SWATCH,
                                                height: SWATCH,
                                                borderRadius: "50%",
                                                bgcolor: color,
                                                // Taken colours stay pickable (a warning, not a rule) but read as spoken for.
                                                opacity: takenByOther && !isSelected ? 0.35 : 1,
                                                outline: isSelected ? 2 : 0,
                                                outlineColor: "text.primary",
                                                outlineOffset: 2,
                                                transition: "opacity .15s, transform .15s",
                                                "&:hover": { transform: "scale(1.1)" },
                                            }}
                                        />
                                    </Tooltip>
                                );
                            })}
                            {/* Native picker for anything off-palette */}
                            <Tooltip title="Custom colour">
                                <Box
                                    component="input"
                                    type="color"
                                    value={selectedHex ?? TEAM_PALETTE[0]}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => handleChange("color")(event.target.value)}
                                    disabled={pending}
                                    aria-label="Custom colour"
                                    sx={{
                                        width: SWATCH + 8,
                                        height: SWATCH + 4,
                                        p: 0.25,
                                        border: 1,
                                        borderColor: "divider",
                                        borderRadius: 1.5,
                                        bgcolor: "transparent",
                                        cursor: "pointer",
                                    }}
                                />
                            </Tooltip>
                            <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary" }}>
                                {selectedHex ?? draft.color}
                            </Typography>
                        </Box>
                        {check.colorWarning && (
                            <Typography variant="caption" sx={{ display: "block", mt: 1, color: "warning.main" }}>
                                {check.colorWarning}
                            </Typography>
                        )}
                    </Box>

                    {/* 4. Preview — how a slot of theirs looks on the schedule */}
                    <Box>
                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.75 }}>
                            On the calendar
                        </Typography>
                        <Box
                            sx={{
                                display: "inline-flex",
                                px: 1.25,
                                py: 0.5,
                                borderRadius: 1,
                                bgcolor: selectedHex ?? "grey.500",
                                color: "#fff",
                                fontSize: 13,
                                fontWeight: 600,
                            }}
                        >
                            10:00 AM · {draft.name.trim() || "New professional"}
                        </Box>
                    </Box>
                </Stack>
            </DialogContent>

            {/* 5. Actions */}
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} disabled={pending} color="inherit">
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={pending || !check.canSave || !changed}
                    variant="contained"
                    sx={{ fontWeight: 700, borderRadius: 2 }}
                >
                    {pending ? "Saving…" : employee ? "Save changes" : "Add to team"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
