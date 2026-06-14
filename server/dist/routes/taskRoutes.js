"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskController_1 = require("../controllers/taskController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// To support both JWT and direct access, we make endpoints flexible:
// If JWT is present, protect middleware will extract user context.
// However, we allow the request to proceed so direct API calls with userId in body work too.
router.post('/', (req, res, next) => {
    if (req.headers.authorization) {
        (0, auth_1.protect)(req, res, next);
    }
    else {
        next();
    }
}, taskController_1.createTask);
router.get('/:userId', taskController_1.getUserTasks);
router.put('/:id', taskController_1.updateTask);
router.delete('/:id', taskController_1.deleteTask);
exports.default = router;
