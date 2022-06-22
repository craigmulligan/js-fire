# Contributing

Hi :wave:, First off thanks for your help :)

When contributing to this repository, please first discuss the change you wish to make via issue,
email, or any other method with the owners of this repository before making a change.

## Pull Request Process

1.  Make your changes, we dont have a build step so this should be fairly easy. You can use the test suite if you prefer tdd.
1.  Update the README.md with details of changes to the interface.
1.  Please include integration tests for your change. Unit tests are not encouraged unless its a particularly complex piece of logic.


## Publishing a release

Once the change is merged to master. Bump the version in package.json and add a git tag with the same version. Then push that to github and create a "release". On creating a release the package will be published to npm.
