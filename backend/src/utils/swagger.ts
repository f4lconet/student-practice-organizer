import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API сервиса «Практика»',
      version: '1.0.0',
      description:
        'API для приёма заявок на практику, ведения документооборота и контроля задач практикантов по когортам.',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Локальный сервер разработки',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Cohort: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            name: {
              type: 'string',
              description: 'Название/год когорты, например "2026"',
            },
            applicationStart: {
              type: 'string',
              format: 'date-time',
              description: 'Начало приёма заявок',
            },
            applicationEnd: {
              type: 'string',
              format: 'date-time',
              description: 'Окончание приёма заявок',
            },
            practiceStart: {
              type: 'string',
              format: 'date-time',
              description: 'Начало практики',
            },
            practiceEnd: {
              type: 'string',
              format: 'date-time',
              description: 'Окончание практики',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CohortRole: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            cohortId: {
              type: 'string',
            },
            name: {
              type: 'string',
              description: 'Название роли/трека, например "Frontend"',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Человекочитаемое описание ошибки',
                },
                code: {
                  type: 'string',
                  description: 'Машиночитаемый код ошибки (например, VALIDATION_ERROR)',
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  console.log('Документация Swagger доступна по адресу http://localhost:4000/api-docs');
};