## TCD Advanced Searchbox

A directive based on [Angular Advanced Searchbox](https://github.com/dnauck/angular-advanced-searchbox)


### Usage

Include with bower

```sh
bower install tcd-advanced-searchbox
```

The bower package contains files in the ```dist/```directory with the following names:

- tcd-advanced-searchbox.js
- tcd-advanced-searchbox.min.js
- tcd-advanced-searchbox.css
- tcd-advanced-searchbox.min.css

Files with the ```min``` suffix are minified versions to be used in production. If you don't need the default template use the ```angular-paginate-anything.min.js``` file and provide your own template with the ```templateUrl``` attribute.

Load the javascript and css and declare your Angular dependency

```html
<link rel="stylesheet" href="bower_components/tcd-advanced-searchbox/dist/tcd-advanced-searchbox.min.css">
<script src="bower_components/tcd-advanced-searchbox/dist/tcd-advanced-searchbox.min.js"></script>
```

```js
angular.module('myModule', ['tcd-advanced-searchbox']);
```

Then in your view

```html
<tcd-advanced-searchbox
	ng-model="searchParams"
	parameters="availableSearchParams"
	placeholder="Search...">
</tcd-advanced-searchbox>
```
