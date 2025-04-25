# COSMO RLT Monitoring

Sistema de monitoreo para el seguimiento de formularios pendientes en instituciones educativas.

## Descripción

Esta aplicación realiza un seguimiento de las instituciones educativas que aún no han alcanzado el mínimo requerido de 25 formularios completados en cada sección (Docentes, Estudiantes, Acudientes).

### Características

- Monitoreo en tiempo real de formularios completados
- Visualización de instituciones pendientes
- Información de contacto detallada de cada institución
- Interfaz intuitiva para seguimiento de progreso

## Tecnologías

- React
- TypeScript
- Material-UI
- Node.js
- PostgreSQL

## Estructura de Datos

### Tablas de Formularios
- docentes_form_submissions
- estudiantes_form_submissions
- acudientes_form_submissions

### Tabla de Contactos
- rectores
  - nombre_de_la_institucion_educativa_en_la_actualmente_desempena_
  - nombre_s_y_apellido_s_completo_s
  - numero_de_celular_personal
  - correo_electronico_personal
  - correo_electronico_institucional_el_que_usted_usa_en_su_rol_com
  - prefiere_recibir_comunicaciones_en_el_correo
  - telefono_de_contacto_de_la_ie
  - correo_electronico_institucional 