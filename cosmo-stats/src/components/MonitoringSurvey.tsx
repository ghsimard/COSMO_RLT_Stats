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
  Chip,
  Divider,
  Tooltip
} from '@mui/material';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

interface SchoolMonitoringData {
  schoolName: string;
  rectorName: string;
  currentPosition: string;
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
  const isPersonalPreferred = school.preferredContact?.toLowerCase().includes('personal');
  const isInstitutionalPreferred = school.preferredContact?.toLowerCase().includes('institucional');

  console.log('ContactDialog - school data:', school);
  console.log('ContactDialog - currentPosition:', school.currentPosition);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Información de Contacto</DialogTitle>
      <DialogContent>
        <Box py={2}>
          <Typography variant="h6" gutterBottom>{school.schoolName}</Typography>
          <Typography variant="subtitle1" gutterBottom>
            {school.rectorName}
          </Typography>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            {school.currentPosition || 'Cargo no especificado'}
          </Typography>

          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            {/* Personal Contact Information */}
            <Box sx={{ 
              p: 2, 
              bgcolor: isPersonalPreferred ? '#e3f2fd' : 'transparent',
              borderRadius: 1
            }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Contacto Personal
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Typography variant="body1">
                  <EmailIcon sx={{ mr: 1 }} />
                  {school.personalEmail}
                </Typography>
                <Typography variant="body1">
                  <PhoneIcon sx={{ mr: 1 }} />
                  {school.personalPhone}
                </Typography>
              </Box>
            </Box>

            {/* Institutional Contact Information */}
            <Box sx={{ 
              p: 2, 
              bgcolor: isInstitutionalPreferred ? '#e3f2fd' : 'transparent',
              borderRadius: 1
            }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Contacto Institucional
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Typography variant="body1">
                  <EmailIcon sx={{ mr: 1 }} />
                  {school.institutionalEmail}
                </Typography>
                <Typography variant="body1">
                  <PhoneIcon sx={{ mr: 1 }} />
                  {school.institutionalPhone}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 1 }} />
            
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
        const response = await fetch(`${API_BASE_URL}/api/monitoring`);
        if (!response.ok) throw new Error('Error al cargar los datos');
        const data = await response.json();
        console.log('API Response:', data);
        console.log('First school currentPosition:', data[0]?.currentPosition);
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
                    <TableCell>Institución</TableCell>
                    <TableCell align="center">Docentes</TableCell>
                    <TableCell align="center">Estudiantes</TableCell>
                    <TableCell align="center">Acudientes</TableCell>
                    <TableCell align="center">Estado</TableCell>
                    <TableCell align="center">Contacto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schools.map((school) => (
                    <TableRow key={`${school.schoolName}-${school.rectorName}`}>
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
                        <Tooltip title={school.meetingRequirements ? "Esta institución ya alcanzó el límite requerido de respuestas" : ""}>
                          <span>
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              startIcon={<ContactPhoneIcon />}
                              onClick={() => handleContactClick(school)}
                              disabled={school.meetingRequirements}
                              sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                minWidth: '120px',
                                '&:hover': {
                                  backgroundColor: 'primary.dark',
                                  transform: 'translateY(-1px)',
                                  transition: 'transform 0.2s'
                                },
                                '&.Mui-disabled': {
                                  backgroundColor: 'rgba(0, 0, 0, 0.12)',
                                  color: 'rgba(0, 0, 0, 0.26)'
                                }
                              }}
                            >
                              Contactar
                            </Button>
                          </span>
                        </Tooltip>
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