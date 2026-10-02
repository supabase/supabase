## ERD

The ER diagrams were created with https://github.com/BurntSushi/erd/.

You can go download erd from https://github.com/BurntSushi/erd/releases and then do:

```bash
./erd_static-x86-64 -i ./er/film.er -o ../_static/film.png
```

The fonts used belong to the GNU FreeFont family. You can download them here: http://ftp.gnu.org/gnu/freefont/

## UML

The UML diagrams are created with https://plantuml.com/.

PlantUML only creates one diagram per file.
That's why we need to create another one for dark mode.
For example, for the file [uml/arch.uml](uml/arch.uml) there's [uml/dark/arch-dark.uml](uml/dark/arch-dark.uml) which includes the first one:

```bash
plantuml -tsvg uml/arch.uml -o ../../_static
plantuml -tsvg -darkmode uml/dark/arch-dark.uml -o ../../../_static
```
