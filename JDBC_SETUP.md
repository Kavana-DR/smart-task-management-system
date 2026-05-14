# Java JDBC + MySQL Setup

This project includes a simple Java JDBC layer for the Smart Task Management System. The existing HTML, CSS, and JavaScript frontend UI is not changed.

The JDBC files are beginner-friendly and suitable for an automation testing internship presentation.

## Added Files

```text
SmartTaskManagementSystem/
├── database/
│   └── schema.sql              # MySQL database and table creation
└── java/
    ├── DatabaseConnection.java # Opens MySQL JDBC connection
    └── TaskDAO.java            # Insert, fetch, update, delete task operations
```

## MySQL Setup

1. Install MySQL Server.
2. Install MySQL Workbench, optional but recommended.
3. Open MySQL Workbench.
4. Run this SQL file:

```sql
SOURCE D:/KodnestInternship/KodnestFinalProject/SmartTaskManagementSystem/database/schema.sql;
```

You can also copy the contents of `database/schema.sql` into a query tab and run it.

The schema creates:

```text
Database: task_manager
Tables: users, tasks
```

The `tasks` table contains:

```text
id
title
description
priority
status
due_date
```

## JDBC Driver Setup

1. Download MySQL Connector/J from the official MySQL website.
2. Extract the downloaded file.
3. Find the connector jar, for example:

```text
mysql-connector-j-8.4.0.jar
```

4. Create a `lib` folder in this project.
5. Place the jar inside the `lib` folder:

```text
SmartTaskManagementSystem/lib/mysql-connector-j-8.4.0.jar
```

## Database Credentials

Open `java/DatabaseConnection.java`.

Update these values if your MySQL username or password is different:

```java
private static final String URL = "jdbc:mysql://localhost:3306/task_manager";
private static final String USERNAME = "root";
private static final String PASSWORD = "root";
```

## Running in VS Code

1. Install VS Code.
2. Install the `Extension Pack for Java`.
3. Open this project folder in VS Code.
4. Make sure MySQL Server is running.
5. Make sure `database/schema.sql` has been executed.
6. Place the MySQL connector jar inside `lib`.

Compile from the project root:

```powershell
javac -cp "lib/mysql-connector-j-8.4.0.jar" java\DatabaseConnection.java java\TaskDAO.java
```

Run the DAO demo on Windows:

```powershell
java -cp "java;lib/mysql-connector-j-8.4.0.jar" TaskDAO
```

Run the DAO demo on macOS/Linux:

```bash
java -cp "java:lib/mysql-connector-j-8.4.0.jar" TaskDAO
```

## JDBC Operations Included

`TaskDAO.java` contains:

```java
insertTask(...)
fetchTasks()
updateTask(...)
deleteTask(...)
```

## JDBC Flow Explained

The Java code follows this simple JDBC flow:

1. Load MySQL JDBC driver.
2. Open a database connection using `DriverManager`.
3. Use `PreparedStatement` to run SQL safely.
4. Use `executeUpdate()` for insert, update, and delete.
5. Use `executeQuery()` and `ResultSet` for fetch.
6. Use try-with-resources to close database resources automatically.

## Presentation Note

The frontend currently uses localStorage for UI task interactions. The JDBC files provide a simple database layer demonstration without Spring Boot, REST APIs, or complex backend architecture.
