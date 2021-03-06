const db = require("../db/connection.js");
const testData = require("../db/data/test-data/index.js");
const { seed } = require("../db/seeds/seed.js");
const request = require("supertest");
const app = require("../app");
const endpoints = require("../endpoints.json");

beforeEach(() => seed(testData));
afterAll(() => db.end());
describe(`API`, () => {
  it(`status 404: when their is a typo in path returns not found`, () => {
    return request(app)
      .get(`/apii/caaaatergo/something`)
      .expect(404)
      .then((res) => {
        expect(res.body.msg).toBe(`Path Not Found`);
      });
  });
  describe(`GET requests`, () => {
    describe(`GET /api`, () => {
      it(`status 200, serves up a json representation of all the available endpoints of the api`, () => {
        return request(app)
          .get(`/api`)
          .expect(200)
          .then(({ body }) => {
            expect(body).toEqual(endpoints);
          });
      });
    });
    describe(`GET /api/categories`, () => {
      it(`status 200, returns an array of category objects with slug and description`, () => {
        return request(app)
          .get(`/api/categories`)
          .expect(200)
          .then(({ body: { categories } }) => {
            expect(categories).toBeInstanceOf(Array);
            expect(categories).toHaveLength(4);
            categories.forEach((obj) => {
              expect.objectContaining({
                slug: expect.any(String),
                description: expect.any(String),
              });
            });
          });
      });
    });
    describe(`GET /api/users`, () => {
      it(`status 200, returns an array of user objects conataining username, name and avatar_url`, () => {
        return request(app)
          .get(`/api/users`)
          .expect(200)
          .then(({ body: { users } }) => {
            expect(users).toBeInstanceOf(Array);
            expect(users).toHaveLength(4);
            users.forEach(() => {
              expect.objectContaining({
                username: expect.any(String),
                name: expect.any(String),
                avatar_url: expect.any(String),
              });
            });
          });
      });
    });
    describe(`GET /api/users/:username`, () => {
      it(`status 200, a user object`, () => {
        return request(app)
          .get(`/api/users/mallionaire`)
          .expect(200)
          .then(({ body: { user } }) => {
            expect(user).toBeInstanceOf(Object);
            expect(Object.entries(user)).toHaveLength(3);
            expect.objectContaining({
              username: expect(user.username).toBe("mallionaire"),
              name: expect(user.name).toBe("haz"),
              avatar_url: expect(user.avatar_url).toBe(
                "https://www.healthytherapies.com/wp-content/uploads/2016/06/Lime3.jpg"
              ),
            });
          });
      });
      it(`status 404: not found - valid input`, () => {
        return request(app)
          .get(`/api/users/wrong`)
          .expect(404)
          .then((res) => {
            expect(res.body.msg).toBe(
              `input 'wrong' not found in 'users' database`
            );
          });
      });
    });
    describe(`GET /api/reviews`, () => {
      it(`status 200, returns an array of review objects and defaults to descending and date`, () => {
        return request(app)
          .get(`/api/reviews`)
          .expect(200)
          .then(({ body: { reviews } }) => {
            expect(reviews).toBeInstanceOf(Array);
            expect(reviews).toHaveLength(10);
            expect(reviews).toBeSortedBy(`created_at`, {
              descending: true,
            });
            reviews.forEach((obj) => {
              expect(Object.entries(obj)).toHaveLength(9);
              expect.objectContaining({
                owner: expect.any(String),
                title: expect.any(String),
                review_id: expect.any(Number),
                category: expect.any(String),
                review_img_url: expect.any(String),
                created_at: expect.any(Date),
                votes: expect.any(Number),
                comment_count: expect.any(Number),
                total_count: expect(obj.total_count).toBe(13),
              });
            });
          });
      });
      it(`status 200, accepts a sort_by query for any column defaults to date`, () => {
        return request(app)
          .get(`/api/reviews?sort_by=votes`)
          .expect(200)
          .then(({ body: { reviews } }) => {
            expect(reviews).toBeSortedBy(`votes`, {
              descending: true,
            });
          });
      });
      it(`status 404: incorrect sort_by input`, () => {
        return request(app)
          .get(`/api/reviews?sort_by=wrong`)
          .expect(404)
          .then((res) => {
            expect(res.body.msg).toBe(`Input query not found`);
          });
      });
      it(`status 200, accepts a order query defaults to descending`, () => {
        return request(app)
          .get(`/api/reviews?sort_by=votes&order=ASC`)
          .expect(200)
          .then(({ body: { reviews } }) => {
            expect(reviews).toBeSortedBy(`votes`, { ascending: true });
          });
      });

      it(`status 404: incorrect order input`, () => {
        return request(app)
          .get(`/api/reviews?order=wrong`)
          .expect(404)
          .then((res) => {
            expect(res.body.msg).toBe(`Input query not found`);
          });
      });
      it(`status 200, accepts a category query with defaults`, () => {
        return request(app)
          .get(`/api/reviews?category=social deduction`)
          .expect(200)
          .then(({ body: { reviews } }) => {
            expect(reviews).toHaveLength(10);
            expect(reviews[0].total_count).toBe(11);
            expect(reviews).toBeSortedBy(`created_at`, {
              descending: true,
            });
          });
      });
      it(`status 404: incorrect category input`, () => {
        return request(app)
          .get(`/api/reviews?category=wrong`)
          .expect(404)
          .then((res) => {
            expect(res.body.msg).toBe(
              `input 'wrong' not found in 'reviews' database`
            );
          });
      });
      it(`status 200, accepts a page "p" query defaults to 1`, () => {
        return request(app)
          .get(`/api/reviews?p=2`)
          .expect(200)
          .then(({ body: { reviews } }) => {
            expect(reviews).toHaveLength(3);
            expect(reviews[0].total_count).toBe(13);
          });
      });
      it(`status 400, wrong value set to page query`, () => {
        return request(app)
          .get(`/api/reviews?p=wrong`)
          .expect(400)
          .then((res) => {
            expect(res.body.msg).toBe(`Invalid input`);
          });
      });
      it(`status 200, accepts a limit query defaults to 10`, () => {
        return request(app)
          .get(`/api/reviews?limit=2`)
          .expect(200)
          .then(({ body: { reviews } }) => {
            expect(reviews).toHaveLength(2);
            expect(reviews[0].total_count).toBe(13);
          });
      });
      it(`status 400, wrong value set to limit query`, () => {
        return request(app)
          .get(`/api/reviews?limit=wrong`)
          .expect(400)
          .then((res) => {
            expect(res.body.msg).toBe(`Invalid input`);
          });
      });
      it(`status 200, accepts a all queries at the same time`, () => {
        return request(app)
          .get(
            `/api/reviews?sort_by=votes&order=ASC&category=social deduction&p=3&limit=5`
          )
          .expect(200)
          .then(({ body: { reviews } }) => {
            expect(reviews).toHaveLength(1);
            expect(reviews).toBeSortedBy(`votes`, { ascending: true });
          });
      });
    });
    describe(`GET /api/reviews/:review_id`, () => {
      it(`status 200, a review object`, () => {
        return request(app)
          .get(`/api/reviews/1`)
          .expect(200)
          .then(({ body: { review } }) => {
            expect(review).toBeInstanceOf(Object);
            expect(Object.entries(review)).toHaveLength(10);
            expect.objectContaining({
              owner: expect(review.owner).toBe("mallionaire"),
              title: expect(review.title).toBe("Agricola"),
              review_id: expect(review.review_id).toBe(1),
              review_body: expect(review.review_body).toBe("Farmyard fun!"),
              designer: expect(review.designer).toBe("Uwe Rosenberg"),
              review_img_url: expect(review.review_img_url).toBe(
                "https://www.golenbock.com/wp-content/uploads/2015/01/placeholder-user.png"
              ),
              category: expect(review.category).toBe("euro game"),
              created_at: expect.any(Date),
              votes: expect(review.votes).toBe(1),
              comment_count: expect(review.comment_count).toBe(0),
            });
          });
      });
      it(`status 400: bad request - invalid input`, () => {
        return request(app)
          .get(`/api/reviews/wrong`)
          .expect(400)
          .then((res) => {
            expect(res.body.msg).toBe(`Invalid input`);
          });
      });
      it(`status 404: not found - valid input`, () => {
        return request(app)
          .get(`/api/reviews/500`)
          .expect(404)
          .then((res) => {
            expect(res.body.msg).toBe(
              `input '500' not found in 'reviews' database`
            );
          });
      });
    });
    describe(`GET /api/reviews/:review_id/comments`, () => {
      it(`status 200, an array of comments from the given Id`, () => {
        return request(app)
          .get(`/api/reviews/3/comments`)
          .expect(200)
          .then(({ body: { comments } }) => {
            expect(comments).toBeInstanceOf(Array);
            expect(Object.entries(comments)).toHaveLength(3);
            comments.forEach((obj) => {
              expect(Object.entries(obj)).toHaveLength(5);
              expect.objectContaining({
                comment_id: expect.any(Number),
                votes: expect.any(Number),
                created_at: expect.any(Date),
                author: expect.any(String),
                body: expect.any(String),
              });
            });
          });
      });
      it(`status 400: bad request - invalid input`, () => {
        return request(app)
          .get(`/api/reviews/wrong/comments`)
          .expect(400)
          .then((res) => {
            expect(res.body.msg).toBe(`Invalid input`);
          });
      });
      it(`status 404: not found - valid input but incorrect review id`, () => {
        return request(app)
          .get(`/api/reviews/500/comments`)
          .expect(404)
          .then((res) => {
            expect(res.body.msg).toBe(
              `input '500' not found in 'reviews' database`
            );
          });
      });

      it(`status 200, accepts a page "p" query defaults to 1`, () => {
        return request(app)
          .get(`/api/reviews/3/comments?limit=2&p=2`)
          .expect(200)
          .then(({ body: { comments } }) => {
            expect(comments).toHaveLength(1);
          });
      });
      it(`status 200, accepts a limit query defaults to 10`, () => {
        return request(app)
          .get(`/api/reviews/3/comments?limit=2`)
          .expect(200)
          .then(({ body: { comments } }) => {
            expect(comments).toHaveLength(2);
          });
      });
      it(`status 400, wrong value set to limit query`, () => {
        return request(app)
          .get(`/api/reviews/3/comments?limit=wrong`)
          .expect(400)
          .then((res) => {
            expect(res.body.msg).toBe(`Invalid input`);
          });
      });
      it(`status 400, wrong value set to page query`, () => {
        return request(app)
          .get(`/api/reviews/3/comments?p=wrong`)
          .expect(400)
          .then((res) => {
            expect(res.body.msg).toBe(`Invalid input`);
          });
      });
    });
  });
  describe(`PATCH Requests`, () => {
    describe(`PATCH /api/reviews/:review_id`, () => {
      it(`status 200, takes an object with inc_votes or/and review_body either increment or decrement the votes property, and will return the updated review`, () => {
        const data = { inc_votes: -10, review_body: "this is new review body" };
        return request(app)
          .patch(`/api/reviews/1`)
          .send(data)
          .expect(200)
          .then(({ body: { review } }) => {
            expect(review).toBeInstanceOf(Object);
            expect(Object.entries(review)).toHaveLength(9);
            expect.objectContaining({
              owner: expect(review.owner).toBe("mallionaire"),
              title: expect(review.title).toBe("Agricola"),
              review_id: expect(review.review_id).toBe(1),
              review_body: expect(review.review_body).toBe(
                "this is new review body"
              ),
              designer: expect(review.designer).toBe("Uwe Rosenberg"),
              review_img_url: expect(review.review_img_url).toBe(
                "https://www.golenbock.com/wp-content/uploads/2015/01/placeholder-user.png"
              ),
              category: expect(review.category).toBe("euro game"),
              created_at: expect.any(Date),
              votes: expect(review.votes).toBe(-9),
            });
          });
      });
      it(`status 400: bad request - invalid value`, () => {
        const data = { inc_votes: `wrong` };
        return request(app)
          .patch(`/api/reviews/1`)
          .send(data)
          .expect(400)
          .then((res) => {
            expect(res.body.msg).toBe(`Invalid input`);
          });
      });
      it(`status 200: extra key-pairs are ignored`, () => {
        const data = {
          inc_votes: -10,
          review_body: "this is new review body",
          wrong: "wrong",
          title: "wrong title",
        };
        return request(app)
          .patch(`/api/reviews/1`)
          .send(data)
          .expect(200)
          .then(({ body: { review } }) => {
            expect(review).toBeInstanceOf(Object);
            expect(Object.entries(review)).toHaveLength(9);
            expect.objectContaining({
              owner: expect(review.owner).toBe("mallionaire"),
              title: expect(review.title).toBe("Agricola"),
              review_id: expect(review.review_id).toBe(1),
              review_body: expect(review.review_body).toBe(
                "this is new review body"
              ),
              designer: expect(review.designer).toBe("Uwe Rosenberg"),
              review_img_url: expect(review.review_img_url).toBe(
                "https://www.golenbock.com/wp-content/uploads/2015/01/placeholder-user.png"
              ),
              category: expect(review.category).toBe("euro game"),
              created_at: expect.any(Date),
              votes: expect(review.votes).toBe(-9),
            });
          });
      });
    });
    describe(`PATCH /api/comments/:comment_id`, () => {
      it(`status 200, takes an object with inc_votes, and will return the updated review`, () => {
        const data = { inc_votes: -6 };
        return request(app)
          .patch(`/api/comments/1`)
          .send(data)
          .expect(200)
          .then(({ body: { comment } }) => {
            expect(comment).toBeInstanceOf(Object);
            expect(Object.entries(comment)).toHaveLength(6);
            expect.objectContaining({
              comment_id: expect(comment.comment_id).toBe(1),
              author: expect(comment.author).toBe("bainesface"),
              body: expect(comment.body).toBe("I loved this game too!"),
              review_id: expect(comment.review_id).toBe(2),
              created_at: expect.any(1511354613389),
              votes: expect(comment.votes).toBe(10),
            });
          });
      });
      it(`status 400: bad request - invalid value`, () => {
        const data = { inc_votes: `wrong` };
        return request(app)
          .patch(`/api/comments/1`)
          .send(data)
          .expect(400)
          .then((res) => {
            expect(res.body.msg).toBe(`Invalid input`);
          });
      });
      it(`status 200: extra key-pairs are ignored and is votes number is empty or zero`, () => {
        const data = { inc_votes: 0, wrong: "wrong", title: "wrong title" };
        return request(app)
          .patch(`/api/comments/1`)
          .send(data)
          .expect(200)
          .then(({ body: { comment } }) => {
            expect(comment).toBeInstanceOf(Object);
            expect(Object.entries(comment)).toHaveLength(6);
            expect.objectContaining({
              comment_id: expect(comment.comment_id).toBe(1),
              author: expect(comment.author).toBe("bainesface"),
              body: expect(comment.body).toBe("I loved this game too!"),
              review_id: expect(comment.review_id).toBe(2),
              created_at: expect.any(1511354613389),
              votes: expect(comment.votes).toBe(16),
            });
          });
      });
      it(`status 400: bad request - invalid input`, () => {
        return request(app)
          .patch(`/api/comments/wrong`)
          .expect(400)
          .then((res) => {
            expect(res.body.msg).toBe(`Invalid input`);
          });
      });
      it(`status 404: not found - valid input`, () => {
        return request(app)
          .patch(`/api/comments/500`)
          .expect(404)
          .then((res) => {
            expect(res.body.msg).toBe(
              `input '500' not found in 'comments' database`
            );
          });
      });
    });
    describe(`PATCH /api/comments/:comment_id --- body`, () => {
      it(`status 200, takes an object with a new body, and will return the updated review`, () => {
        const data = { inc_votes: -6, body: "this will replace previous body" };
        return request(app)
          .patch(`/api/comments/1`)
          .send(data)
          .expect(200)
          .then(({ body: { comment } }) => {
            expect(comment).toBeInstanceOf(Object);
            expect(Object.entries(comment)).toHaveLength(6);
            expect.objectContaining({
              comment_id: expect(comment.comment_id).toBe(1),
              author: expect(comment.author).toBe("bainesface"),
              body: expect(comment.body).toBe(
                "this will replace previous body"
              ),
              review_id: expect(comment.review_id).toBe(2),
              created_at: expect.any(1511354613389),
              votes: expect(comment.votes).toBe(10),
            });
          });
      });
      it(`status 200: extra key-pairs are ignored and is votes number is empty or zero`, () => {
        const data = {
          body: "this will replace body",
          inc_votes: 0,
          wrong: "wrong",
          title: "wrong title",
        };
        return request(app)
          .patch(`/api/comments/1`)
          .send(data)
          .expect(200)
          .then(({ body: { comment } }) => {
            expect(comment).toBeInstanceOf(Object);
            expect(Object.entries(comment)).toHaveLength(6);
            expect.objectContaining({
              comment_id: expect(comment.comment_id).toBe(1),
              author: expect(comment.author).toBe("bainesface"),
              body: expect(comment.body).toBe("this will replace body"),
              review_id: expect(comment.review_id).toBe(2),
              created_at: expect.any(1511354613389),
              votes: expect(comment.votes).toBe(16),
            });
          });
      });
      it(`status 400: bad request - invalid input`, () => {
        return request(app)
          .patch(`/api/comments/wrong`)
          .expect(400)
          .then((res) => {
            expect(res.body.msg).toBe(`Invalid input`);
          });
      });
      it(`status 404: not found - valid input`, () => {
        return request(app)
          .patch(`/api/comments/500`)
          .expect(404)
          .then((res) => {
            expect(res.body.msg).toBe(
              `input '500' not found in 'comments' database`
            );
          });
      });
    });
    describe(`PATCH /api/users/:username`, () => {
      it(`status 200, takes an object with name, avatar_url, and will return the updated user`, () => {
        const data = {
          name: "new name",
          avatar_url: "www.newurl.com",
        };
        return request(app)
          .patch(`/api/users/mallionaire`)
          .send(data)
          .expect(200)
          .then(({ body: { user } }) => {
            expect(user).toBeInstanceOf(Object);
            expect(Object.entries(user)).toHaveLength(3);
            expect.objectContaining({
              username: expect(user.username).toBe("mallionaire"),
              name: expect(user.name).toBe("new name"),
              avatar_url: expect(user.avatar_url).toBe("www.newurl.com"),
            });
          });
      });
      it(`status 200: extra key-pairs are ignored`, () => {
        const data = {
          name: "new name",
          avatar_url: "www.newurl.com",
          wrong: "wrong",
        };
        return request(app)
          .patch(`/api/users/mallionaire`)
          .send(data)
          .expect(200)
          .then(({ body: { user } }) => {
            expect(user).toBeInstanceOf(Object);
            expect(Object.entries(user)).toHaveLength(3);
            expect.objectContaining({
              username: expect(user.username).toBe("mallionaire"),
              name: expect(user.name).toBe("new name"),
              avatar_url: expect(user.avatar_url).toBe("www.newurl.com"),
            });
          });
      });
    });
  });
  describe(`POST requests`, () => {
    describe(`POST /api/reviews/:review_id/comments`, () => {
      it(`status 201, accepts a body with username and body and posts a comment to that review`, () => {
        const data = {
          username: `dav3rid`,
          body: `this is a review without a comment yet`,
        };
        return request(app)
          .post(`/api/reviews/1/comments`)
          .send(data)
          .expect(201)
          .then(({ body: { comment } }) => {
            expect(comment).toBeInstanceOf(Object);
            expect(Object.entries(comment)).toHaveLength(6);
            expect.objectContaining({
              comment_id: expect(comment.comment_id).toBe(7),
              body: expect(comment.body).toBe(
                "this is a review without a comment yet"
              ),
              votes: expect(comment.votes).toBe(0),
              author: expect(comment.author).toBe("dav3rid"),
              review_id: expect(comment.review_id).toBe(1),
              created_at: expect.any(Date),
            });
          });
      });
      it(`status 400: bad request - invalid key`, () => {
        const data = {
          wrong: `dav3rid`,
          body: `this is a review without a comment yet`,
        };
        return request(app)
          .post(`/api/reviews/1/comments`)
          .send(data)
          .expect(400)
          .then((res) => {
            expect(res.body.msg).toBe(`Invalid input`);
          });
      });
      it(`status 400: bad request - invalid second key`, () => {
        const data = {
          username: `dav3rid`,
          wrong: `this is a review without a comment yet`,
        };
        return request(app)
          .post(`/api/reviews/1/comments`)
          .send(data)
          .expect(400)
          .then((res) => {
            expect(res.body.msg).toBe(`Invalid input`);
          });
      });
      it(`status 201, accepts a body with username and body and posts a comment to that review without any extra properties`, () => {
        const data = {
          username: `dav3rid`,
          body: `this is a review without a comment yet`,
          wrong: "this is extra",
        };
        return request(app)
          .post(`/api/reviews/1/comments`)
          .send(data)
          .expect(201)
          .then(({ body: { comment } }) => {
            expect(comment).toBeInstanceOf(Object);
            expect(Object.entries(comment)).toHaveLength(6);
            expect.objectContaining({
              comment_id: expect.any(Number),
              body: expect.any(String),
              votes: expect.any(Number),
              author: expect.any(String),
              review_id: expect.any(Number),
              created_at: expect.any(Date),
            });
          });
      });
      it(`status 400: empty object`, () => {
        const data = {};
        return request(app)
          .post(`/api/reviews/1/comments`)
          .send(data)
          .expect(400)
          .then((res) => {
            expect(res.body.msg).toBe(`Invalid input`);
          });
      });
    });
    describe(`POST /api/reviews`, () => {
      it(`status 201, accepts a body with a owner,title, review_body, designer, and category. Returns a new full review object`, () => {
        const data = {
          owner: "philippaclaire9",
          title: "test title",
          review_body: "test body",
          designer: "test designer",
          category: "euro game",
        };
        return request(app)
          .post(`/api/reviews`)
          .send(data)
          .expect(201)
          .then(({ body: { review } }) => {
            expect(review).toBeInstanceOf(Object);
            expect(Object.entries(review)).toHaveLength(10);
            expect.objectContaining({
              owner: expect(review.owner).toBe("philippaclaire9"),
              title: expect(review.title).toBe("test title"),
              review_body: expect(review.review_body).toBe("test body"),
              designer: expect(review.designer).toBe("test designer"),
              category: expect(review.category).toBe("euro game"),
              review_id: expect(review.review_id).toBe(14),
              votes: expect(review.votes).toBe(0),
              created_at: expect.any(Date),
              comment_count: expect(review.comment_count).toBe(0),
            });
          });
      });
      it(`status 400: bad request - invalid key`, () => {
        const data = {
          wrong: "philippaclaire9",
          title: "test title",
          review_body: "test body",
          designer: "test designer",
          category: "euro game",
        };
        return request(app)
          .post(`/api/reviews`)
          .send(data)
          .expect(400)
          .then((res) => {
            expect(res.body.msg).toBe(`Invalid input`);
          });
      });
      it(`status 201, accepts a body with extra properties but doesn't return them extra properties`, () => {
        const data = {
          owner: "philippaclaire9",
          title: "test title",
          review_body: "test body",
          designer: "test designer",
          category: "euro game",
          wrong: "this is extra",
        };
        return request(app)
          .post(`/api/reviews`)
          .send(data)
          .expect(201)
          .then(({ body: { review } }) => {
            expect(review).toBeInstanceOf(Object);
            expect(Object.entries(review)).toHaveLength(10);
            expect.objectContaining({
              owner: expect(review.owner).toBe("philippaclaire9"),
              title: expect(review.title).toBe("test title"),
              review_body: expect(review.review_body).toBe("test body"),
              designer: expect(review.designer).toBe("test designer"),
              category: expect(review.category).toBe("euro game"),
              review_id: expect(review.review_id).toBe(14),
              votes: expect(review.votes).toBe(0),
              created_at: expect.any(Date),
              comment_count: expect(review.comment_count).toBe(0),
            });
          });
      });
      it(`status 400: empty object`, () => {
        const data = {};
        return request(app)
          .post(`/api/reviews`)
          .send(data)
          .expect(400)
          .then((res) => {
            expect(res.body.msg).toBe(`Invalid input`);
          });
      });
    });
    describe(`POST /api/categories`, () => {
      it(`status 201, accepts a body with a slug and description and returns new category object`, () => {
        const data = {
          slug: "category name here",
          description: "description here",
        };
        return request(app)
          .post(`/api/categories`)
          .send(data)
          .expect(201)
          .then(({ body: { category } }) => {
            expect(category).toBeInstanceOf(Object);
            expect(Object.entries(category)).toHaveLength(2);
            expect.objectContaining({
              slug: expect(category.slug).toBe("category name here"),
              description: expect(category.description).toBe(
                "description here"
              ),
            });
          });
      });
      it(`status 400: bad request - invalid key`, () => {
        const data = {
          wrong: "wrong",
          description: "test description",
        };
        return request(app)
          .post(`/api/categories`)
          .send(data)
          .expect(400)
          .then((res) => {
            expect(res.body.msg).toBe(`Invalid input`);
          });
      });
      it(`status 201, accepts a body with extra properties but doesn't return them extra properties`, () => {
        const data = {
          slug: "test slug",
          description: "test description",
          extra: "test extra",
        };
        return request(app)
          .post(`/api/categories`)
          .send(data)
          .expect(201)
          .then(({ body: { category } }) => {
            expect(category).toBeInstanceOf(Object);
            expect(Object.entries(category)).toHaveLength(2);
            expect.objectContaining({
              slug: expect(category.slug).toBe("test slug"),
              description: expect(category.description).toBe(
                "test description"
              ),
            });
          });
      });
      it(`status 400: empty object`, () => {
        const data = {};
        return request(app)
          .post(`/api/categories`)
          .send(data)
          .expect(400)
          .then((res) => {
            expect(res.body.msg).toBe(`Invalid input`);
          });
      });
    });
    describe(`POST /api/users`, () => {
      it(`status 201, accepts a body with a username,
      name, and avatar_url, and returns new user object`, () => {
        const data = {
          username: "testUsername",
          name: "testName",
          avatar_url: "www.avatar_url.com",
        };
        return request(app)
          .post(`/api/users`)
          .send(data)
          .expect(201)
          .then(({ body: { user } }) => {
            expect(user).toBeInstanceOf(Object);
            expect(Object.entries(user)).toHaveLength(3);
            expect.objectContaining({
              username: expect(user.username).toBe("testUsername"),
              name: expect(user.name).toBe("testName"),
              avatar_url: expect(user.avatar_url).toBe("www.avatar_url.com"),
            });
          });
      });
      it(`status 400: bad request - invalid key`, () => {
        const data = {
          wrong: "wrong key",
          name: "testName",
          avatar_url: "www.avatar_url.com",
        };
        return request(app)
          .post(`/api/users`)
          .send(data)
          .expect(400)
          .then((res) => {
            expect(res.body.msg).toBe(`Invalid input`);
          });
      });
      it(`status 201, accepts a body with extra properties but doesn't return them extra properties`, () => {
        const data = {
          username: "testUsername",
          name: "testName",
          avatar_url: "www.avatar_url.com",
          extra: "test extra",
        };
        return request(app)
          .post(`/api/users`)
          .send(data)
          .expect(201)
          .then(({ body: { user } }) => {
            expect(user).toBeInstanceOf(Object);
            expect(Object.entries(user)).toHaveLength(3);
            expect.objectContaining({
              username: expect(user.username).toBe("testUsername"),
              name: expect(user.name).toBe("testName"),
              avatar_url: expect(user.avatar_url).toBe("www.avatar_url.com"),
            });
          });
      });
      it(`status 400: empty object`, () => {
        const data = {};
        return request(app)
          .post(`/api/users`)
          .send(data)
          .expect(400)
          .then((res) => {
            expect(res.body.msg).toBe(`Invalid input`);
          });
      });
      it(`status 400: bad request - username already exists`, () => {
        const data = {
          username: "mallionaire",
          name: "testName",
          avatar_url: "www.avatar_url.com",
        };
        return request(app)
          .post(`/api/users`)
          .send(data)
          .expect(400)
          .then((res) => {
            expect(res.body.msg).toBe(`Username already exists`);
          });
      });
    });
  });
  describe(`DELETE requests`, () => {
    describe("DELETE /api/comments/:comment_id", () => {
      it("status:204, responds with an empty response body", () => {
        return request(app).delete("/api/comments/1").expect(204);
      });
      it(`status 400: bad request - invalid input`, () => {
        return request(app)
          .delete("/api/comments/wrong")
          .expect(400)
          .then((res) => {
            expect(res.body.msg).toBe(`Invalid input`);
          });
      });
      it(`status 404: not found - valid input`, () => {
        return request(app)
          .delete("/api/comments/500")
          .expect(404)
          .then((res) => {
            expect(res.body.msg).toBe(
              `input '500' not found in 'comments' database`
            );
          });
      });
    });
    describe("DELETE /api/reviews/:review_id", () => {
      it("status:204, responds with an empty response body", () => {
        return request(app).delete("/api/reviews/1").expect(204);
      });
      it(`status 400: bad request - invalid input`, () => {
        return request(app)
          .delete("/api/reviews/wrong")
          .expect(400)
          .then((res) => {
            expect(res.body.msg).toBe(`Invalid input`);
          });
      });
      it(`status 404: not found - valid input`, () => {
        return request(app)
          .delete("/api/reviews/500")
          .expect(404)
          .then((res) => {
            expect(res.body.msg).toBe(
              `input '500' not found in 'reviews' database`
            );
          });
      });
    });
  });
});
