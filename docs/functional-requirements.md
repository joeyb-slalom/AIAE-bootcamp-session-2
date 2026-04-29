# Functional Requirements: TODO App

## Core Requirements

1. The system shall allow a user to create a new TODO item with a required text title.
2. The system shall reject creation requests when the title is empty or only whitespace.
3. The system shall assign each TODO item a unique identifier.
4. The system shall mark new TODO items as not completed by default.
5. The system shall allow a user to view a list of all TODO items.
6. The system shall allow a user to update an existing TODO item title.
7. The system shall allow a user to toggle an existing TODO item between completed and not completed states.
8. The system shall allow a user to delete an existing TODO item.
9. The system shall return a clear not-found response when update, toggle, or delete operations target a non-existent TODO item.
10. The system shall persist TODO item changes for the duration of the running application session.
11. The system shall allow a user to optionally assign a due date to a TODO item during creation.
12. The system shall allow a user to add, update, or remove a due date on an existing TODO item.
13. The system shall validate due dates and reject invalid date formats.

## List and Filtering Behavior

14. The system shall support filtering TODO items by status: all, active, and completed.
15. The system shall display the current completion state for each TODO item in list results.
16. The system shall display each TODO item's due date when one is set.
17. The system shall allow filtering TODO items by due date state: all, with due date, and without due date.
18. The system shall allow clearing all completed TODO items in a single action.

## API and Frontend Interaction

19. The backend shall expose RESTful endpoints to create, read, update, and delete TODO items.
20. The backend TODO data contract shall include an optional due date field.
21. The frontend shall consume backend TODO endpoints and update the UI based on API responses.
22. The frontend shall provide controls to set, edit, and clear due dates for TODO items.
23. The frontend shall show error feedback when a TODO operation fails.

## Testing Requirements

24. Unit tests shall cover TODO creation validation, due date validation, status toggling, and update/delete behavior.
25. Integration tests shall verify end-to-end backend TODO API behavior for create, read, update, delete, and due date persistence operations.
26. E2E tests shall validate key user flows: adding a TODO, setting a due date, completing a TODO, filtering TODOs, and deleting a TODO.
