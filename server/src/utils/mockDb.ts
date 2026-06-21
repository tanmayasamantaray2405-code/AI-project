import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'mock-db.json');

interface MockData {
  users: any[];
  tasks: any[];
}

const getInitialData = (): MockData => ({
  users: [],
  tasks: [],
});

const loadDb = (): MockData => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load mock database file, using empty default:', error);
  }
  return getInitialData();
};

const saveDb = (data: MockData): void => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save mock database file:', error);
  }
};

export const MockDB = {
  getUsers: () => {
    return loadDb().users;
  },

  findUser: (query: any) => {
    const users = loadDb().users;
    return users.find((user) => {
      for (const key in query) {
        if (user[key] !== query[key]) return false;
      }
      return true;
    });
  },

  findUserById: (id: string) => {
    const users = loadDb().users;
    return users.find((user) => user._id === id);
  },

  createUser: (userData: any) => {
    const db = loadDb();
    const newUser = {
      _id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: { theme: 'light' },
      ...userData,
    };
    db.users.push(newUser);
    saveDb(db);
    return newUser;
  },

  updateUser: (id: string, updateData: any) => {
    const db = loadDb();
    const index = db.users.findIndex((user) => user._id === id);
    if (index === -1) return null;

    db.users[index] = {
      ...db.users[index],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    saveDb(db);
    return db.users[index];
  },

  getTasks: () => {
    return loadDb().tasks;
  },

  findTasks: (query: any) => {
    const tasks = loadDb().tasks;
    return tasks.filter((task) => {
      for (const key in query) {
        if (task[key] !== query[key]) return false;
      }
      return true;
    });
  },

  findTaskById: (id: string) => {
    const tasks = loadDb().tasks;
    return tasks.find((task) => task._id === id);
  },

  createTask: (taskData: any) => {
    const db = loadDb();
    const newTask = {
      _id: Math.random().toString(36).substring(2, 11),
      priority: 'medium',
      difficulty: 'beginner',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...taskData,
    };
    db.tasks.push(newTask);
    saveDb(db);
    return newTask;
  },

  updateTask: (id: string, updateData: any) => {
    const db = loadDb();
    const index = db.tasks.findIndex((task) => task._id === id);
    if (index === -1) return null;

    const task = db.tasks[index];
    
    // Support completion date calculation
    let completedAt = task.completedAt;
    if (updateData.status === 'completed' && task.status !== 'completed') {
      completedAt = new Date().toISOString();
    } else if (updateData.status === 'pending') {
      completedAt = undefined;
    }

    db.tasks[index] = {
      ...task,
      ...updateData,
      completedAt,
      updatedAt: new Date().toISOString(),
    };
    saveDb(db);
    return db.tasks[index];
  },

  deleteTask: (id: string) => {
    const db = loadDb();
    const initialLength = db.tasks.length;
    db.tasks = db.tasks.filter((task) => task._id !== id);
    saveDb(db);
    return db.tasks.length !== initialLength;
  },

  deleteUser: (id: string) => {
    const db = loadDb();
    const initialUsersLength = db.users.length;
    db.users = db.users.filter((user) => user._id !== id);
    db.tasks = db.tasks.filter((task) => task.userId !== id);
    saveDb(db);
    return db.users.length !== initialUsersLength;
  },
};
