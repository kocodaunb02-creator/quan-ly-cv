import 'dotenv/config';
import express from 'express';
import authRoutes from './src/routes/auth.routes.js';
import candidateRoutes from './src/routes/candidate.routes.js';

const app = express();
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);

app._router.stack.forEach(function (r: any) {
    if (r.route && r.route.path) {
        console.log(r.route.path)
    } else if (r.name === 'router') {
        r.handle.stack.forEach(function (handler: any) {
            const route = handler.route;
            if (route) {
                console.log(r.regexp.toString(), route.path)
            }
        });
    }
});
