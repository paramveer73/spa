import React, { useState } from "react";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Stack,
    IconButton,
    Divider
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import CancelIcon from "@mui/icons-material/Cancel";
import SaveIcon from "@mui/icons-material/Save";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { firebase } from "@/app_state";
import EmployeeCard from "./EventsAddingForm/EmployeeCard";

interface Employee {
    id: string;
    name: string;
    color: string;
    role?: string;
}

interface EmployeeCrudManagerProps {
    employeesList: Employee[];
}

export default function EmployeeCrudManager({ employeesList = [] }: EmployeeCrudManagerProps) {
    const [name, setName] = useState("");
    const [color, setColor] = useState("#9c27b0");
    const [role, setRole] = useState("Professional");

    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSelectToEdit = (employee: Employee) => {
        setEditingEmployee(employee);
        setName(employee.name);
        setColor(employee.color);
        setRole(employee.role || "Professional");
    };

    const handleCancelEdit = () => {
        setEditingEmployee(null);
        setName("");
        setColor("#9c27b0");
        setRole("Professional");
    };

    const handleDelete = async () => {
        if (!editingEmployee) return;
        const confirmDelete = window.confirm(`Are you sure you want to delete ${editingEmployee.name}?`);
        if (!confirmDelete) return;

        setIsSubmitting(true);
        try {
            await firebase.deleteEmployee(editingEmployee.id);
            handleCancelEdit();
        } catch (err) {
            alert("Failed to delete employee. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return alert("Please enter a valid name");

        setIsSubmitting(true);
        try {
            if (editingEmployee) {
                await firebase.updateEmployee(editingEmployee.id, { name, color, role });
            } else {
                await firebase.addEmployee({ name, color, role });
            }
            handleCancelEdit();
        } catch (err) {
            alert("Failed to save profile. Please check your network.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" }, // Balanced screen distribution
                gap: 4,
                my: 2,
                width: "100%",
                boxSizing: "border-box"
            }}
        >
            {/* LEFT PANEL: Directory List */}
            <Paper elevation={1} sx={{ p: 4, borderRadius: 4, border: "1px solid #e5e7eb", boxSizing: "border-box" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: "#111827" }}>
                    Staff Profiles Directory
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
                    Click an existing card below to configure settings, change theme profiles, or delete them from availability.
                </Typography>

                {employeesList.length === 0 ? (
                    <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic", py: 2 }}>
                        No staff profiles registered yet. Create one using the form on the right.
                    </Typography>
                ) : (
                    <Box
                        sx={{
                            display: "grid",
                            // Native auto-fit columns ensure they span correctly without squishing
                            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                            gap: 2,
                            width: "100%",
                            boxSizing: "border-box"
                        }}
                    >
                        {employeesList.map((emp) => (
                            <Box
                                key={emp.id}
                                sx={{
                                    display: 'flex',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <EmployeeCard
                                    employee={emp}
                                    activeEmployee={editingEmployee}
                                    handleActiveEmployee={handleSelectToEdit}
                                />
                            </Box>
                        ))}
                    </Box>
                )}
            </Paper>

            {/* RIGHT PANEL: Live Database Form Editor */}
            <Paper
                elevation={3}
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    p: 4,
                    borderRadius: 4,
                    border: editingEmployee ? "1px solid #1976d2" : "1px solid #e5e7eb",
                    backgroundColor: editingEmployee ? "#fafcfd" : "#ffffff",
                    alignSelf: "start",
                    boxSizing: "border-box"
                }}
            >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#111827" }}>
                        {editingEmployee ? "Edit Professional" : "Create New Profile"}
                    </Typography>
                    {editingEmployee && (
                        <IconButton size="small" onClick={handleCancelEdit}>
                            <CancelIcon color="action" />
                        </IconButton>
                    )}
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Stack spacing={3}>
                    <TextField
                        label="Full Name"
                        variant="outlined"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSubmitting}
                        required
                    />

                    <TextField
                        label="Role / Speciality"
                        variant="outlined"
                        fullWidth
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        disabled={isSubmitting}
                    />

                    <Box>
                        <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600, color: "text.secondary" }}>
                            Profile Color Code:
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box
                                type="color"
                                component="input"
                                value={color}
                                onChange={(e: any) => setColor(e.target.value)}
                                disabled={isSubmitting}
                                sx={{
                                    width: 54,
                                    height: 48,
                                    border: "1px solid #ccc",
                                    borderRadius: 2,
                                    cursor: "pointer",
                                    padding: "2px",
                                    outline: "none",
                                }}
                            />
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: color }}>
                                    Preview Color Selection
                                </Typography>
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                    This color will decorate their UI slots and headers.
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>

                    <Stack spacing={1.5} sx={{ mt: 1 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            color={editingEmployee ? "primary" : "success"}
                            fullWidth
                            disabled={isSubmitting}
                            startIcon={editingEmployee ? <SaveIcon /> : <AddCircleOutlineIcon />}
                            sx={{ py: 1.5, borderRadius: 3, fontWeight: 700 }}
                        >
                            {editingEmployee ? "Update Profile" : "Add Profile to Database"}
                        </Button>

                        {editingEmployee && (
                            <Button
                                variant="outlined"
                                color="error"
                                fullWidth
                                disabled={isSubmitting}
                                onClick={handleDelete}
                                startIcon={<DeleteOutlineIcon />}
                                sx={{ py: 1.2, borderRadius: 3, fontWeight: 700 }}
                            >
                                Delete Selected Employee
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
}