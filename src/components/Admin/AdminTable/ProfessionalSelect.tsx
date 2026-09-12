import { MenuItem, TextField } from "@mui/material";
import type { Employee } from "@/components/calendar";
import { ALL_PROFESSIONALS, UNASSIGNED, UNASSIGNED_LABEL } from "@/utils/employees";
import ProfessionalTag from "./ProfessionalTag";

export interface ProfessionalSelectProps {
    employees: Employee[];
    /** An employee id, ALL_PROFESSIONALS or UNASSIGNED. */
    value: string;
    onChange: (value: string) => void;
}

/** The "whose rows" filter shared by the bookings and open-slots tables. */
export default function ProfessionalSelect({ employees, value, onChange }: ProfessionalSelectProps) {
    return (
        <TextField
            select
            size="small"
            label="Professional"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            sx={{ minWidth: 200 }}
        >
            <MenuItem value={ALL_PROFESSIONALS}>Everyone</MenuItem>
            {employees.map((employee) => (
                <MenuItem key={employee.id} value={employee.id}>
                    <ProfessionalTag name={employee.name} color={employee.color} />
                </MenuItem>
            ))}
            <MenuItem value={UNASSIGNED}>
                <ProfessionalTag name={UNASSIGNED_LABEL} missing />
            </MenuItem>
        </TextField>
    );
}
