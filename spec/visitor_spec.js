const path = require("path");
const {
  addNewVisitor,
  listAllVisitors,
  viewVisitor,
  deleteVisitor,
  updateVisitor,
  viewLastVisitor,
  deleteAllVisitors,
  visitorQueries,
  querySuccess,
  queryError,
  validateInput,
  validationErrorMessages,
  createTable,
} = require("../src/visitors.js");
require("dotenv").config({ path: path.resolve(__dirname, "./.env") });

const visitor = {
  name: "John Doe",
  age: 30,
  dateOfVisit: "2024-09-29",
  timeOfVisit: "10:30",
  assistant: "Jane Smith",
  comments: "No comments",
};

describe("visitor database", function () {
  const Pool = require("pg").Pool;
  let poolQuerySpy;

  beforeEach(() => {
    poolQuerySpy = spyOn(Pool.prototype, "query").and.callFake(
      async (query, values) => {
        if (query.includes("RETURNING *")) {
          return { rows: [{ id: 1 }] };
        }
        if (query.includes("FROM visitors WHERE id = $1")) {
          return { rows: [{ id: 1, name: "John Doe", age: 30 }] };
        }
        return { rows: [] };
      }
    );
  });

  describe("createTable", function () {
    it("should execute the query to create the visitors table", async () => {
      const message = await createTable();

      expect(poolQuerySpy).toHaveBeenCalledOnceWith(
        visitorQueries.createTableQuery
      );
      expect(message).toBe(querySuccess.tableCreated);
    });
  });

  describe("validateInput", function () {
    describe("validateInput function", () => {
      it("should throw an error if 'name' is missing", () => {
        expect(() =>
          validateInput("", 30, "2024-09-29", "10:30", "Jane Smith", "comments")
        ).toThrowError(validationErrorMessages.invalidName);
      });

      it("should throw an error if 'age' is missing", () => {
        expect(() =>
          validateInput(
            "John Doe",
            null,
            "2024-09-29",
            "10:30",
            "Jane Smith",
            "comments"
          )
        ).toThrowError(validationErrorMessages.invalidAge);
      });

      it("should throw an error if 'dateOfVisit' is missing", () => {
        expect(() =>
          validateInput("John Doe", 30, "", "10:30", "Jane Smith", "comments")
        ).toThrowError(validationErrorMessages.invalidDateOfVisit);
      });

      it("should throw an error if 'comments' is missing", () => {
        expect(() =>
          validateInput("John Doe", 30, "2024-09-29", "10:30", "Jane Smith", "")
        ).toThrowError(validationErrorMessages.invalidComments);
      });

      it("should throw an error if 'timeOfVisit' is missing", () => {
        expect(() =>
          validateInput(
            "John Doe",
            30,
            "2024-09-29",
            "",
            "Jane Smith",
            "comments"
          )
        ).toThrowError(validationErrorMessages.invalidTimeOfVisit);
      });

      it("should throw an error if 'assistant' is missing", () => {
        expect(() =>
          validateInput("John Doe", 30, "2024-09-29", "10:30", "", "comments")
        ).toThrowError(validationErrorMessages.invalidAssistant);
      });

      it("should throw an error if 'name' is invalid", () => {
        expect(() =>
          validateInput(
            123,
            30,
            "2024-09-29",
            "10:30",
            "Jane Smith",
            "comments"
          )
        ).toThrowError(validationErrorMessages.invalidName);
      });

      it("should throw an error if 'age' is invalid", () => {
        expect(() =>
          validateInput(
            "John Doe",
            "30",
            "2024-09-29",
            "10:30",
            "Jane Smith",
            "comments"
          )
        ).toThrowError(validationErrorMessages.invalidAge);
      });

      it("should throw an error if 'assistant' is invalid", () => {
        expect(() =>
          validateInput("John Doe", 30, "2024-09-29", "10:30", 123, "comments")
        ).toThrowError(validationErrorMessages.invalidAssistant);
      });

      it("should throw an error if 'age' is negative", () => {
        expect(() =>
          validateInput(
            "John Doe",
            -5,
            "2024-09-29",
            "10:30",
            "Jane Smith",
            "comments"
          )
        ).toThrowError(validationErrorMessages.invalidAge);
      });
    });

    it("should throw an error if 'comments' is not a string (if provided)", () => {
      expect(() =>
        validateInput("John Doe", 30, "2024-09-29", "10:30", "Jane Smith", 123)
      ).toThrowError(validationErrorMessages.invalidComments);
    });

    it("should not throw any error for valid input", () => {
      expect(() =>
        validateInput(
          "John Doe",
          30,
          "2024-09-29",
          "10:30",
          "Jane Smith",
          "comments"
        )
      ).not.toThrow();
    });
  });

  describe("addNewVisitor", function () {
    it("should insert a new visitor into the database with correct parameters and return the ID of the newly inserted visitor", async () => {
      const newVisitorId = await addNewVisitor(visitor);

      expect(poolQuerySpy).toHaveBeenCalledWith(
        `${visitorQueries.addNewVisitor}`, 
        ["John Doe", 30, "2024-09-29", "10:30", "Jane Smith", "No comments"]
      );

      expect(newVisitorId).toBe(1); 
    });
  });

  describe("listAllVisitors", function () {
    it("should retrieve all visitors from the database", async () => {
      await listAllVisitors();

      expect(poolQuerySpy).toHaveBeenCalledWith(visitorQueries.listAllVisitors);
    });
  });

  describe("viewVisitor", function () {
    it("should retrieve a visitor from the database by ID", async () => {
      const visitorId = 1;

      await viewVisitor(visitorId);

      expect(poolQuerySpy).toHaveBeenCalledWith(visitorQueries.viewVisitor, [
        visitorId,
      ]);
    });

    it("should throw an error if the visitor ID does not exist when trying to view", async () => {
      const visitorId = 999;
      poolQuerySpy.and.callFake((query, params) => {
        if (query === visitorQueries.viewVisitor) {
          return Promise.resolve({ rows: [] });
        }
      });

      await expectAsync(viewVisitor(visitorId)).toBeRejectedWithError(
        queryError.visitorNotFound(visitorId)
      );
    });
  });

  describe("updateVisitor function", () => {
    it("should update visitor details if the visitor ID exists", async () => {
      const visitorId = 1;
      const updatedVisitor = {
        name: "John Doe",
        age: 30,
        dateOfVisit: "2024-09-29",
        timeOfVisit: "10:30",
        assistant: "Jane Smith",
        comments: "No comments",
      };

      const result = await updateVisitor(
        visitorId,
        "name",
        updatedVisitor.name
      );

      expect(poolQuerySpy.calls.mostRecent().args[0]).toBe(
        `UPDATE visitors SET name=$1 WHERE id=$2`
      );
      expect(poolQuerySpy.calls.mostRecent().args[1]).toEqual([
        updatedVisitor.name,
        visitorId,
      ]);
    });

    it("should throw an error if the visitor ID does not exist", async () => {
      const visitorId = 999;

      poolQuerySpy.and.callFake((query, params) => {
        if (query === visitorQueries.viewVisitor) {
          return Promise.resolve({ rows: [] });
        }
      });

      const updatedVisitor = {
        name: "Valid Name",
        age: 30,
        dateOfVisit: "2024-09-29",
        timeOfVisit: "10:30",
        assistant: "Jane Smith",
        comments: "No comments",
      };

      await expectAsync(
        updateVisitor(visitorId, "name", updatedVisitor.name)
      ).toBeRejectedWithError(queryError.visitorNotFound(visitorId));
    });
  });
  describe("deleteVisitor", function () {
    it("should delete a visitor from the database if the ID exists", async () => {
      const visitorId = 1;

      poolQuerySpy.and.callFake((query, params) => {
        if (query === visitorQueries.viewVisitor) {
          return Promise.resolve({ rows: [{ id: visitorId }] });
        }
        if (query === visitorQueries.deleteVisitor) {
          return Promise.resolve();
        }
      });

      const message = await deleteVisitor(visitorId);

      expect(poolQuerySpy).toHaveBeenCalledWith(visitorQueries.viewVisitor, [
        visitorId,
      ]);

      expect(poolQuerySpy).toHaveBeenCalledWith(visitorQueries.deleteVisitor, [
        visitorId,
      ]);

      expect(message).toBe(querySuccess.visitorDeleted(visitorId));
    });


    it("should throw an error if the visitor ID does not exist when trying to delete", async () => {
      const visitorId = 999;
      
      poolQuerySpy.and.callFake((query, params) => {
        if (query === visitorQueries.viewVisitor) {
          return Promise.resolve({ rows: [] });
        }
      });

      await expectAsync(deleteVisitor(visitorId)).toBeRejectedWithError(
        queryError.visitorNotFound(visitorId)
      );
    });
  });

  describe("deleteAllVisitors", function () {
    it("should delete all visitors from the database", async () => {
      poolQuerySpy.and.callFake((query) => {
        if (query === visitorQueries.listAllVisitors) {
          return Promise.resolve({ rows: [{ id: 1, name: "John Doe" }] });
        }
        if (query === visitorQueries.deleteAllVisitors) {
          return Promise.resolve();
        }
      });
  
      const message = await deleteAllVisitors();
  
      expect(poolQuerySpy).toHaveBeenCalledWith(visitorQueries.listAllVisitors);
      expect(poolQuerySpy).toHaveBeenCalledWith(visitorQueries.deleteAllVisitors);
      expect(message).toBe(querySuccess.allVisitorsDeleted);
    });
  
    it("should handle the case when there are no visitors to delete", async () => {
      poolQuerySpy.and.callFake((query) => {
        if (query === visitorQueries.listAllVisitors) {
          return Promise.resolve({ rows: [] });
        }
      });
  
      await expectAsync(deleteAllVisitors()).toBeRejectedWithError(
        queryError.noVisitors
      );
  
      expect(poolQuerySpy).toHaveBeenCalledWith(visitorQueries.listAllVisitors);
    });
  });

  

  describe("viewLastVisitor", function () {
    it("should throw an error if no visitors exist when trying to view the last visitor", async () => {
      poolQuerySpy.and.callFake((query) => {
        if (query === visitorQueries.viewLastVisitor) {
          return Promise.resolve({ rows: [] }); // Simulating no visitors in the database
        }
      });
    
      await expectAsync(viewLastVisitor()).toBeRejectedWithError(
        queryError.noVisitorsFound
      );
    });

    it("should retrieve the last visitor ID from the database", async () => {
      poolQuerySpy.and.callFake((query) => {
        if (query === visitorQueries.viewLastVisitor) {
          return Promise.resolve({ rows: [{ id: 1 }] }); // Mocking only the visitor ID
        }
      });
    
      const lastVisitorId = await viewLastVisitor();
    
      expect(poolQuerySpy).toHaveBeenCalledWith(visitorQueries.viewLastVisitor);
      expect(lastVisitorId).toEqual(1); // Assert that the returned value is the ID
    });
  });
});