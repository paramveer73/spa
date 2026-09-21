import { useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    InputAdornment,
    MenuItem,
    Stack,
    Switch,
    TextField,
} from "@mui/material";
import { categoryPaths, type CategoryRecord, type ServiceRecord } from "@/data/catalog";
import { formatDuration } from "@/utils/format";
import {
    DURATION_MAX,
    DURATION_MIN,
    DURATION_PRESETS,
    NAME_MAX,
    checkServiceDraft,
    draftFromService,
    isDraftChanged,
    type ServiceDraft,
} from "./serviceDraft";

export interface ServiceDialogProps {
    open: boolean;
    /** The service being edited; null adds a new one. */
    service: ServiceRecord | null;
    services: ServiceRecord[];
    categories: CategoryRecord[];
    onClose: () => void;
    /** Rejecting keeps the dialog open with the error. */
    onSave: (draft: ServiceDraft) => Promise<void>;
}

/** Add or edit one service: what it's called, where it sits on the menu, what it costs and how long it takes. */
export default function ServiceDialog({ open, service, services, categories, onClose, onSave }: ServiceDialogProps) {
    const paths = useMemo(() => categoryPaths(categories), [categories]);
    const defaultCategoryId = paths[0]?.id ?? "";
    const [draft, setDraft] = useState<ServiceDraft>(() => draftFromService(service, defaultCategoryId));
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [wasOpen, setWasOpen] = useState(open);

    // Each open starts from the record (or a blank draft), not the last edit.
    // Reset during render rather than in an effect, which would paint one
    // frame of the previous draft first. Only on opening: a change arriving
    // over the listener mustn't wipe what's being typed.
    if (open !== wasOpen) {
        setWasOpen(open);
        if (open) {
            setDraft(draftFromService(service, defaultCategoryId));
            setError(null);
        }
    }

    const check = checkServiceDraft(draft, services, categories, service?.id ?? null);
    const changed = isDraftChanged(draft, service);
    const minutes = Number(draft.duration);

    const handleChange = <K extends keyof ServiceDraft>(field: K, value: ServiceDraft[K]) =>
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
            <DialogTitle sx={{ fontWeight: 800 }}>{service ? `Edit ${service.name}` : "Add a service"}</DialogTitle>

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
                        onChange={(event) => handleChange("name", event.target.value)}
                        disabled={pending}
                        required
                        autoFocus
                        fullWidth
                        error={!!check.nameError && draft.name !== ""}
                        helperText={(draft.name !== "" && check.nameError) || check.nameWarning || "As clients see it on the menu."}
                        slotProps={{
                            htmlInput: { maxLength: NAME_MAX },
                            formHelperText: { sx: { color: check.nameWarning && !check.nameError ? "warning.main" : undefined } },
                        }}
                    />

                    {/* 2. Where it sits on the menu */}
                    <Box>
                        <TextField
                            select
                            label="Category"
                            value={draft.categoryId}
                            onChange={(event) => handleChange("categoryId", event.target.value)}
                            disabled={pending}
                            required
                            fullWidth
                            error={!!check.categoryError}
                            helperText={check.categoryError || " "}
                        >
                            {paths.map((path) => (
                                <MenuItem key={path.id} value={path.id} sx={{ pl: 2 + path.depth * 2 }}>
                                    {path.label}
                                </MenuItem>
                            ))}
                        </TextField>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={draft.addOn}
                                    onChange={(event) => handleChange("addOn", event.target.checked)}
                                    disabled={pending}
                                />
                            }
                            label="Add-on — listed under the category's extras"
                        />
                    </Box>

                    {/* 3. Price and length */}
                    <Box>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                            <TextField
                                label="Price"
                                value={draft.price}
                                onChange={(event) => handleChange("price", event.target.value)}
                                disabled={pending}
                                required
                                error={!!check.priceError && draft.price !== ""}
                                helperText={(draft.price !== "" && check.priceError) || " "}
                                slotProps={{
                                    input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                                    htmlInput: { inputMode: "decimal" },
                                }}
                            />
                            <TextField
                                label="Length"
                                type="number"
                                value={draft.duration}
                                onChange={(event) => handleChange("duration", event.target.value)}
                                disabled={pending}
                                required
                                error={!!check.durationError}
                                helperText={check.durationError || (Number.isFinite(minutes) && minutes > 0 ? formatDuration(minutes) : " ")}
                                slotProps={{
                                    input: { endAdornment: <InputAdornment position="end">min</InputAdornment> },
                                    htmlInput: { min: DURATION_MIN, max: DURATION_MAX, step: 5 },
                                }}
                            />
                        </Box>
                        {/* Length decides which openings fit, so the common ones are a tap away. */}
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                            {DURATION_PRESETS.map((preset) => (
                                <Chip
                                    key={preset}
                                    label={formatDuration(preset)}
                                    size="small"
                                    disabled={pending}
                                    onClick={() => handleChange("duration", String(preset))}
                                    color={minutes === preset ? "primary" : "default"}
                                    variant={minutes === preset ? "filled" : "outlined"}
                                />
                            ))}
                        </Box>
                    </Box>

                    {/* 4. Staff note */}
                    <TextField
                        label="Internal note"
                        value={draft.note}
                        onChange={(event) => handleChange("note", event.target.value)}
                        disabled={pending}
                        fullWidth
                        multiline
                        minRows={2}
                        helperText="For the team. Not shown on the booking page."
                    />
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
                    {pending ? "Saving…" : service ? "Save changes" : "Add to menu"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
