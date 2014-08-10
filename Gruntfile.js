/*jshint camelcase: false*/
// Generated on 2014-03-10 using generator-chromeapp 0.2.5
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {
    // show elapsed time at the end
    require('time-grunt')(grunt);
    // load all grunt tasks
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        yeoman: {
            app: 'app',
            dist: 'dist'
        },
        watch: {
            options: {
                spawn: false
            },
            livereload: {
                options: {
                    livereload: '<%= connect.livereload.options.livereload %>'
                },
                files: [
                    '<%= yeoman.app %>/*.html',
                    '<%= yeoman.app %>/*.css',
                    '<%= yeoman.app %>/*.js',
                    '<%= yeoman.app %>/mysql/*.js',
                    '<%= yeoman.app %>/lib/*.js',
                    '<%= yeoman.app %>/manifest.json'
                ]
            }
        },
        connect: {
            options: {
                port: 9000,
                // change this to '0.0.0.0' to access the server from outside
                hostname: 'localhost'
            },
            livereload: {
                options: {
                    livereload: 35729,
                    base: [
                        '<%= yeoman.app %>'
                    ]
                }
            },
            test: {
                options: {
                    base: [
                        'test',
                        '<%= yeoman.app %>'
                    ]
                }
            }
        },
        clean: {
            all: [
                "dist"
            ]
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: [
                'Gruntfile.js',
                '<%= yeoman.app %>/*.js',
                'test/spec/{,*/}*.js'
            ]
        },
        useminPrepare: {
            options: {
                dest: '<%= yeoman.dist %>'
            },
            html: [
                '<%= yeoman.app %>/console.html'
            ]
        },
        usemin: {
            options: {
                dest: '<%= yeoman.dist %>'
            },
            html: [
                '<%= yeoman.dist %>/console.html'
            ]
        },
        htmlmin: {
            dist: {
                options: {
                },
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>',
                    src: 'console.html',
                    dest: '<%= yeoman.dist %>'
                }]
            }
        },
        preprocess: {
            options: {
                inline: true,
                context: {
                    DEBUG: false
                }
            },
            html: {
                src: [
                    '<%= yeoman.dist %>/console.html'
                ]
            }
        },
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.dist %>',
                    src: [
                        '*.{webp,gif,png}',
                        '*.css',
                        '*.js',
                        'lib/{,*/}*.*',
                        'mysql/{,*/}*.*',
                        '*.html'
                    ]
                }]
            }
        },
        concurrent: {
            dist: [
                'htmlmin'
            ]
        },
        chromeManifest: {
            dist: {
                options: {
                    buildnumber: false,
                    background: {
                        target: 'background.js',
                        exclude: [
                            'chromereload.js'
                        ]
                    }
                },
                src: '<%= yeoman.app %>',
                dest: '<%= yeoman.dist %>'
            }
        },
        compress: {
            dist: {
                options: {
                    archive: 'package/chrome_mysql_console.zip'
                },
                files: [{
                    expand: true,
                    cwd: 'dist/',
                    src: ['**'],
                    dest: ''
                }]
            }
        }
    });

    grunt.registerTask('debug', function (opt) {
        if (opt && opt === 'jshint') {
            var watch = grunt.config('watch');
            watch.livereload.tasks.push('jshint');
            grunt.config('watch', watch);
        }

        grunt.task.run([
            'jshint',
            'connect:livereload',
            'watch'
        ]);
    });

    grunt.registerTask('test', [
        'connect:test'
    ]);

    grunt.registerTask('build', [
        'clean',
        'chromeManifest:dist',
        'useminPrepare',
        'concurrent:dist',
        'concat',
        'uglify',
        'copy',
        'usemin',
        'preprocess',
        'compress'
    ]);

    grunt.registerTask('default', [
        'jshint',
        'test',
        'build'
    ]);
};
