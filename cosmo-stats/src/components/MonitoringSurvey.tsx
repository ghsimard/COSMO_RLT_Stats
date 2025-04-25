import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

interface SchoolMonitoringData {
  schoolName: string;
  rectorName: string;
  personalEmail: string;
  institutionalEmail: string;
  personalPhone: string;
  institutionalPhone: string;
  preferredContact: string;
  submissions: {
    docentes: number;
    estudiantes: number;
    acudientes: number;
  };
  meetingRequirements: boolean;
}

interface ContactDialogProps {
  open: boolean;
  onClose: () => void;
  school: SchoolMonitoringData;
}

const ContactDialog: React.FC<ContactDialogProps> = ({ open, onClose, school }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Información de Contacto</DialogTitle>
      <DialogContent>
        <Box py={2}>
          <Typography variant="h6" gutterBottom>{school.schoolName}</Typography>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Rector:</strong> {school.rectorName}
          </Typography>
          <Box display="flex" flexDirection="column" gap={1} mt={2}>
            <Typography variant="body1">
              <EmailIcon sx={{ mr: 1 }} />
              Correo Personal: {school.personalEmail}
            </Typography>
            <Typography variant="body1">
              <EmailIcon sx={{ mr: 1 }} />
              Correo Institucional: {school.institutionalEmail}
            </Typography>
            <Typography variant="body1">
              <PhoneIcon sx={{ mr: 1 }} />
              Teléfono Personal: {school.personalPhone}
            </Typography>
            <Typography variant="body1">
              <PhoneIcon sx={{ mr: 1 }} />
              Teléfono Institucional: {school.institutionalPhone}
            </Typography>
            <Typography variant="body1">
              <ContactPhoneIcon sx={{ mr: 1 }} />
              Contacto preferido: {school.preferredContact}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export const MonitoringSurvey: React.FC = () => {
  const [schools, setSchools] = useState<SchoolMonitoringData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<SchoolMonitoringData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:4001/api/monitoring');
        if (!response.ok) throw new Error('Error al cargar los datos');
        const data = await response.json();
        setSchools(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleContactClick = (school: SchoolMonitoringData) => {
    setSelectedSchool(school);
  };

  const handleCloseDialog = () => {
    setSelectedSchool(null);
  };

  const getSubmissionStatus = (count: number) => {
    if (count >= 25) {
      return <Chip label={count} color="success" />;
    }
    return <Chip label={count} color="error" />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="monitoring-survey">
      <header className="bg-white shadow">
        <Container maxWidth="lg">
          <Box py={4}>
            <Typography variant="h3" component="h1" gutterBottom>
              Monitoreo de Encuestas
            </Typography>
          </Box>
        </Container>
      </header>

      <Container maxWidth="lg">
        <Box py={4}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Paper elevation={3}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Institución Educativa</TableCell>
                    <TableCell align="center">Docentes</TableCell>
                    <TableCell align="center">Estudiantes</TableCell>
                    <TableCell align="center">Acudientes</TableCell>
                    <TableCell align="center">Estado</TableCell>
                    <TableCell align="center">Contacto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schools.map((school) => (
                    <TableRow key={school.schoolName}>
                      <TableCell>{school.schoolName}</TableCell>
                      <TableCell align="center">
                        {getSubmissionStatus(school.submissions.docentes)}
                      </TableCell>
                      <TableCell align="center">
                        {getSubmissionStatus(school.submissions.estudiantes)}
                      </TableCell>
                      <TableCell align="center">
                        {getSubmissionStatus(school.submissions.acudientes)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={school.meetingRequirements ? "Completo" : "Pendiente"}
                          color={school.meetingRequirements ? "success" : "warning"}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<ContactPhoneIcon />}
                          onClick={() => handleContactClick(school)}
                          disabled={school.meetingRequirements}
                        >
                          Contactar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Container>

      {selectedSchool && (
        <ContactDialog
          open={true}
          onClose={handleCloseDialog}
          school={selectedSchool}
        />
      )}
    </div>
  );
}; 