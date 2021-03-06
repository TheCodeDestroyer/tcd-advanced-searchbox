/*! 
 * angular-advanced-searchbox
 * https://github.com/dnauck/angular-advanced-searchbox
 * Copyright (c) 2015 Nauck IT KG http://www.nauck-it.de/
 * Author: Daniel Nauck <d.nauck(at)nauck-it.de>
 * License: MIT
 */

(function() {

    'use strict';

    angular.module('tcd-advanced-searchbox', [])
        .directive('tcdAdvancedSearchbox', function() {
            return {
                restrict: 'E',
                scope: {
                    model: '=ngModel',
                    parameters: '='
                },
                replace: true,
                templateUrl: 'tcd-advanced-searchbox.html',
                controller: [
                    '$scope', '$attrs', '$element', '$timeout', '$filter',
                    function ($scope, $attrs, $element, $timeout, $filter) {

                        $scope.placeholder = $attrs.placeholder || 'Search ...';
                        $scope.searchParams = [];
                        $scope.searchQuery = '';
                        $scope.setSearchFocus = false;
                        if($attrs.equalityChoices) {
                            $scope.equalityChoices = $attrs.equalityChoices;
                        }
                        else {
                            $scope.equalityChoices = [
                                { value: 'Eq', text: 'Equal' },
                                { value: 'Neq', text: 'Not equal' },
                                { value: 'Lt', text: 'Lower' },
                                { value: 'Gt', text: 'Greater' },
                                { value: 'Lte', text: 'Equal or Lower' },
                                { value: 'Gte', text: 'Equal or Greater' },
                                { value: 'Con', text: 'Contains' }
                            ];
                        }

                        $scope.$watch('searchQuery', function () {
                            updateModel();
                        });

                        $scope.$watch('searchParams', function () {
                            updateModel();
                        }, true);

                        $scope.enterEditMode = function(index) {
                            if (index === undefined) {
                                return;
                            }

                            var searchParam = $scope.searchParams[index];
                            searchParam.editMode = true;
                        };

                        $scope.leaveEditMode = function(index) {
                            if (index === undefined) {
                                return;
                            }

                            var searchParam = $scope.searchParams[index];
                            searchParam.editMode = false;

                            // remove empty search params
                            if (!searchParam.value) {
                                $scope.removeSearchParam(index);
                            }
                        };

                        $scope.typeaheadOnSelect = function (item, model, label) {
                            $scope.addSearchParam(item);
                            $scope.searchQuery = '';
                        };

                        $scope.addSearchParam = function (searchParam, value, enterEditModel) {
                            if (enterEditModel === undefined) {
                                enterEditModel = true;
                            }

                            if (!searchParam.equality) {
                                searchParam.equality = $scope.equalityChoices[0];
                            }

                            $scope.searchParams.push(
                                {
                                    key: searchParam.key,
                                    name: searchParam.name,
                                    equality: searchParam.equality,
                                    type: searchParam.type,
                                    placeholder: searchParam.placeholder,
                                    value: value || '' ,
                                    editMode: enterEditModel
                                }
                            );
                        };

                        $scope.removeSearchParam = function (index) {
                            if (index === undefined) {
                                return;
                            }

                            $scope.searchParams.splice(index, 1);
                        };

                        $scope.removeAll = function() {
                            $scope.searchParams = [];
                            $scope.searchQuery = '';
                        };

                        $scope.editPrevious = function(currentIndex) {
                            if (currentIndex !== undefined) {
                                $scope.leaveEditMode(currentIndex);
                            }

                            //TODO: check if index == 0 -> what then?
                            if (currentIndex > 0) {
                                $scope.enterEditMode(currentIndex - 1);
                            } else if ($scope.searchParams.length > 0) {
                                $scope.enterEditMode($scope.searchParams.length - 1);
                            }
                        };

                        $scope.editNext = function(currentIndex) {
                            if (currentIndex === undefined) {
                                return;
                            }

                            $scope.leaveEditMode(currentIndex);

                            //TODO: check if index == array length - 1 -> what then?
                            if (currentIndex < $scope.searchParams.length - 1) {
                                $scope.enterEditMode(currentIndex + 1);
                            } else {
                                $scope.setSearchFocus = true;
                            }
                        };

                        $scope.keydown = function(e, searchParamIndex) {
                            var handledKeys = [8, 9, 13, 37, 39];
                            if (handledKeys.indexOf(e.which) === -1) {
                                return;
                            }

                            var cursorPosition = getCurrentCaretPosition(e.target);

                            if (e.which == 8) { // backspace
                                if (cursorPosition === 0) {
                                    $scope.editPrevious(searchParamIndex);
                                }

                            } else if (e.which == 9) { // tab
                                if (e.shiftKey) {
                                    e.preventDefault();
                                    $scope.editPrevious(searchParamIndex);
                                } else {
                                    e.preventDefault();
                                    $scope.editNext(searchParamIndex);
                                }

                            } else if (e.which == 13) { // enter
                                $scope.editNext(searchParamIndex);

                            } else if (e.which == 37) { // left
                                if (cursorPosition === 0) {
                                    $scope.editPrevious(searchParamIndex);
                                }

                            } else if (e.which == 39) { // right
                                if (cursorPosition === e.target.value.length) {
                                    $scope.editNext(searchParamIndex);
                                }
                            }
                        };

                        function restoreModel() {
                            angular.forEach($scope.model, function (value, key) {
                                if (key === 'query') {
                                    $scope.searchQuery = value;
                                } else {
                                    var searchParam = $filter('filter')($scope.parameters, function (param) { return param.key === key; })[0];
                                    if (searchParam !== undefined) {
                                        $scope.addSearchParam(searchParam, value, false);
                                    }
                                }
                            });
                        }

                        if ($scope.model === undefined) {
                            $scope.model = {};
                        } else {
                            restoreModel();
                        }

                        var searchThrottleTimer;
                        function updateModel() {
                            if (searchThrottleTimer) {
                                $timeout.cancel(searchThrottleTimer);
                            }

                            searchThrottleTimer = $timeout(function () {
                                $scope.model = {};

                                if ($scope.searchQuery.length > 0) {
                                    $scope.model.query = $scope.searchQuery;
                                }

                                angular.forEach($scope.searchParams, function (param) {
                                    if (param.value !== undefined && param.value.length > 0) {
                                        if(_.isEmpty($scope.model[param.key])) {
                                            $scope.model[param.key] = [];
                                        }
                                        $scope.model[param.key].push({
                                            searchValue: param.value,
                                            type: param.type,
                                            equality: param.equality.value
                                        });
                                    }
                                });
                            }, 500);
                        }

                        function getCurrentCaretPosition(input) {
                            if (!input) { return 0; }

                            // Firefox & co
                            if (typeof input.selectionStart === 'number') {
                                return input.selectionDirection === 'backward' ? input.selectionStart : input.selectionEnd;

                            } else if (document.selection) { // IE
                                input.focus();
                                var selection = document.selection.createRange();
                                var selectionLength = document.selection.createRange().text.length;
                                selection.moveStart('character', -input.value.length);
                                return selection.text.length - selectionLength;
                            }

                            return 0;
                        }
                    }
                ]
            };
        })
        .directive('tcdSetFocus', ['$timeout', '$parse', function($timeout, $parse) {
            return {
                restrict: 'A',
                link: function($scope, $element, $attrs) {
                    var model = $parse($attrs.tcdSetFocus);
                    $scope.$watch(model, function(value) {
                        if (value === true) {
                            $timeout(function() {
                                $element[0].focus();
                            });
                        }
                    });
                    $element.bind('blur', function() {
                        $scope.$apply(model.assign($scope, false));
                    });
                }
            };
        }
        ])
        .directive('tcdAutoSizeInput', [
            function() {
                return {
                    restrict: 'A',
                    scope: {
                        model: '=ngModel'
                    },
                    link: function($scope, $element) {
                        var container = angular.element('<div style="position: fixed; top: -9999px; left: 0px;"></div>');
                        var shadow = angular.element('<span style="white-space:pre;"></span>');

                        var maxWidth = $element.css('maxWidth') === 'none' ? $element.parent().innerWidth() : $element.css('maxWidth');
                        $element.css('maxWidth', maxWidth);

                        angular.forEach([
                            'fontSize', 'fontFamily', 'fontWeight', 'fontStyle',
                            'letterSpacing', 'textTransform', 'wordSpacing', 'textIndent',
                            'boxSizing', 'borderLeftWidth', 'borderRightWidth', 'borderLeftStyle', 'borderRightStyle',
                            'paddingLeft', 'paddingRight', 'marginLeft', 'marginRight'
                        ], function(css) {
                            shadow.css(css, $element.css(css));
                        });

                        angular.element('body').append(container.append(shadow));

                        function resize() {
                            shadow.text($element.val() || $element.attr('placeholder'));
                            $element.css('width', shadow.outerWidth() + 10);
                        }

                        resize();

                        if ($scope.model) {
                            $scope.$watch('model', function() { resize(); });
                        } else {
                            $element.on('keypress keyup keydown focus input propertychange change', function() { resize(); });
                        }
                    }
                };
            }
        ]);
})();
angular.module('tcd-advanced-searchbox').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('tcd-advanced-searchbox.html',
    "<div class=advancedSearchBox ng-class=\"{ active: focus }\" ng-init=\"focus = false\"><i ng-show=\"searchParams.length < 1 && searchQuery.length === 0\" class=\"search-icon fa fa-search\"></i> <a ng-href=\"\" ng-show=\"searchParams.length > 0 || searchQuery.length > 0\" ng-click=removeAll() role=button><i class=\"remove-all-icon fa fa-trash-o\"></i></a><div><div class=search-parameter ng-repeat=\"searchParam in searchParams\"><a ng-href=\"\" ng-click=removeSearchParam($index) role=button><i class=\"remove fa fa-trash-o\"></i></a><div class=key>{{ searchParam.name }}</div><div class=value><span ng-show=!searchParam.editMode ng-click=enterEditMode($index)>{{ searchParam.value }}</span><div class=dropdown ng-show=\"searchParam.value && !searchParam.editMode\"><button class=\"btn btn-default dropdown-toggle\" type=button id=dropdownMenu1 data-toggle=dropdown aria-expanded=true style=\"line-height: 3px\">{{ searchParam.equality.text }} <span class=caret></span></button><ul class=dropdown-menu role=menu aria-labelledby=dropdownMenu1><li ng-repeat=\"equalityChoice in equalityChoices\" role=presentation><a role=menuitem tabindex=-1 ng-click=\"searchParam.equality = equalityChoice\">{{ equalityChoice.text }}</a></li></ul></div><input name=value tcd-auto-size-input tcd-set-focus=searchParam.editMode ng-keydown=\"keydown($event, $index)\" ng-blur=leaveEditMode($index) ng-show=searchParam.editMode ng-model=searchParam.value placeholder=\"{{ searchParam.placeholder }}\"></div></div><input name=searchbox class=search-parameter-input tcd-set-focus=setSearchFocus ng-keydown=keydown($event) placeholder=\"{{ placeholder }}\" ng-focus=\"focus = true\" ng-blur=\"focus = false\" typeahead-on-select=\"typeaheadOnSelect($item, $model, $label)\" typeahead=\"parameter as parameter.name for parameter in parameters | filter:{name:$viewValue} | limitTo:8\" ng-model=\"searchQuery\"></div><div class=search-parameter-suggestions ng-show=\"parameters && focus\"><span class=title>Parameter Suggestions:</span> <span class=search-parameter ng-repeat=\"param in parameters | limitTo:8\" ng-mousedown=addSearchParam(param)>{{ param.name }}</span></div></div>"
  );

}]);
