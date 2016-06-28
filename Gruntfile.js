module.exports = function(grunt) {
    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

    var pkg = grunt.file.readJSON('package.json');

    /**
     * Version Number
     *
     * @description
     * Increase this number to the desired version for css and javascript files.
     * this will also create a version directory in the css and js folders.
     */
    var version = "2.0.0";

    grunt.initConfig({
        pkg: pkg,
        version: version,
        shell: {
            patternlab: {
                options: {
                    failOnError: false,
                    execOptions: {
                        maxBuffer: 1024 * 1024 * 64
                        // maxBuffer: Infinity
                    },
                },
                command: "php core/builder.php -g",
            },
            go: {
                // command: "php -S localhost:4000 -t public"
            }
        },

        mkdir: {
            prod: {
                options: {
                    mode: 0777,
                    create: ['production/<%= version %>/css', 'production/<%= version %>/js']
                }
            }
        },

        sass: {
            options: {
                imagePath: 'source/images',
                precision: 5,
                includePaths: require('node-bourbon').includePaths
            },
            dev: {
                options: {
                    outputStyle: 'nested',
                    sourceMap: true,
                },
                files: {
                    'public/css/main.css': 'source/css/main.scss',
                    'public/css/styleguide-custom.css': 'source/css/styleguide-custom.scss'
                }
            },
            prod: {
                options: {
                    outputStyle: 'compressed',
                    sourceMap: false,
                },
                files: {
                    'production/<%= version %>/css/main.css': 'source/css/main.scss',
                }
            }
        },

        jsFiles: [
            // Include:
            'source/js/plugins.js',
            'source/js/script.js'
        ],

        uglify: {
            dev: {
                options: {
                    beautify: true,
                    mangle: false,
                    compress: false
                },
                files: {
                    'public/js/script.min.js': ['<%= jsFiles %>']
                }
            },
            prod: {
                options: {
                    beautify: false,
                    mangle: true,
                    compress: true
                },
                files: {
                    'production/<%= version %>/js/script.min.js': ['<%= jsFiles %>']
                }
            }
        },

        imagemin: { // Task
            dynamic: { // Another target
                files: [{
                    expand: true, // Enable dynamic expansion
                    cwd: 'source/images/', // cwd is 'current working directory' - Src matches are relative to this path
                    src: ['**/*.{png,jpg,gif}'], // Actual patterns to match
                    dest: 'public/images/' // Destination path prefix
                }]
            }
        },

        copyFiles: '**/*.{eot,svg,ttf,woff,pdf}',
        copy: {
            target: {
                files: [
                    // includes files within path
                    {
                        expand: true,
                        cwd: 'source/',
                        src: ['<%= copyFiles %>'],
                        dest: 'public/',
                        filter: 'isFile'
                    }
                ]
            }
        },

        // Will Automatically insert the correct prefixes for CSS properties. Just write plain CSS.
        autoprefixer: {
            options: {
                browsers: ['last 2 version', 'ie 9']
            },
            dev: {
                src: 'public/css/*.css'
            },
            prod: {
                src: 'production/<%= version %>/css/*.css'
            }
        },

        // Watch options: what tasks to run when changes to files are saved
        watch: {
            options: {},
            css: {
                files: ['source/css/*.scss'],
                tasks: ['css'] // Compile with Compass when Sass changes are saved
            },
            js: {
                files: ['source/js/*.js'], // Watch for changes in JS files
                tasks: ['javascript']
            },
            html: {
                files: ['source/_patterns/**/*.mustache', 'source/_patterns/**/*.json', 'source/_data/*.json'], // Watch for changes to these html files to run htmlhint (validation) task
                tasks: ['shell:patternlab'],
                options: {
                    spawn: false
                }
            },
            images: {
                files: ['source/images/*.{png,jpg,gif}'],
                tasks: ['images']
            },
            copy: {
                files: ['source/<%= copyFiles %>'],
                tasks: ['copy']
            }
        },

        // Fire up a local server and inject css.
        browserSync: {
            bsFiles: {
                src: [
                    'public/css/*.css',
                    'public/**/*.html',
                    'public/**/*.js',
                    'public/**/*.{svg,png,jpg,gif}'
                ]
            },
            options: {
                watchTask: true,
                proxy: "alps.dev"
            }
        }

    });

    /**
     * CSS tasks
     */
    grunt.registerTask('css', [
        'sass',
        'autoprefixer:dev'
    ]);

    /**
     * JavaScript tasks
     */
    grunt.registerTask('javascript', [
        'uglify:dev'
    ]);

    /**
     * Images tasks
     */
    grunt.registerTask('images', [
        'imagemin'
    ]);

    /**
     * Dev task
     */
    grunt.registerTask('dev', [
        'css',
        'javascript',
        'shell:patternlab',
        'images',
        'copy'
    ]);

    /**
     * Production task
     */
    grunt.registerTask('prod', [
        'mkdir:prod',
        'sass:prod',
        'autoprefixer:prod',
        'uglify:prod',
        'shell:patternlab',
        'images',
        'copy'
    ]);

    /**
     * DeployBot Task
     */
    grunt.registerTask('deploybot', [
        'css',
        'javascript',
        'images',
        'copy'
    ]);



    /**
     * Default Tasks
     */
    grunt.registerTask('default', ['dev', 'browserSync', 'watch']);

    /**
     * Staging Tasks
     */
    grunt.registerTask('staging', ['dev']);

};
