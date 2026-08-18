# [2.2.0](https://github.com/syedamaan7733/saleem-footwear-api/compare/v2.1.0...v2.2.0) (2026-08-18)


### Bug Fixes

* change-pin returns 400 (not 401) on wrong current pin ([bddca57](https://github.com/syedamaan7733/saleem-footwear-api/commit/bddca57f9365e234bb578c11fab1308df454aebd))
* clean up ([c613c7a](https://github.com/syedamaan7733/saleem-footwear-api/commit/c613c7a51fa5e22e9f0d7e5a94ea419556c77541))
* connect to MongoDB on serverless cold start (fixes Vercel 504) ([e0ae174](https://github.com/syedamaan7733/saleem-footwear-api/commit/e0ae174a3d6935dbe2024fcc8b93ca898fa64ec4))
* guard seed-pins migration against accidental re-run ([3b01545](https://github.com/syedamaan7733/saleem-footwear-api/commit/3b015453e79250ab8a46d09373b58ffbe855ca40))


### Features

* add 6-digit pin validator and user lockout fields ([1caf18c](https://github.com/syedamaan7733/saleem-footwear-api/commit/1caf18ce8bd51eaa9381e90884fda427d67ade82))
* add admin-only reset-pin endpoint ([a8689e2](https://github.com/syedamaan7733/saleem-footwear-api/commit/a8689e2766b13e4757b296ef58dce93dedffcf23))
* add authenticated change-pin endpoint ([672e68e](https://github.com/syedamaan7733/saleem-footwear-api/commit/672e68ea491d4644d0cbe3483ba17efaf4e37c44))
* add migration to seed existing users with temp pin ([797b594](https://github.com/syedamaan7733/saleem-footwear-api/commit/797b594ace69ebcb91edbb3e8a1febe6c0d6246b))
* pin login with per-account lockout after 10 attempts ([2a440bd](https://github.com/syedamaan7733/saleem-footwear-api/commit/2a440bd8c8d447410bfd4cb812f0b033142aafc8))
* register accepts 6-digit pin and validates format ([5270cb7](https://github.com/syedamaan7733/saleem-footwear-api/commit/5270cb732abe5ac8bb826f35662e1f28437f8e66))

# Changelog

Release notes are generated automatically by semantic-release.
