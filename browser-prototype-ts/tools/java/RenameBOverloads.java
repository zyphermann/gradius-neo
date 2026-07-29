import com.sun.source.tree.ClassTree;
import com.sun.source.tree.CompilationUnitTree;
import com.sun.source.tree.IdentifierTree;
import com.sun.source.tree.MemberSelectTree;
import com.sun.source.tree.MethodInvocationTree;
import com.sun.source.tree.MethodTree;
import com.sun.source.util.JavacTask;
import com.sun.source.util.SourcePositions;
import com.sun.source.util.TreePath;
import com.sun.source.util.TreePathScanner;
import com.sun.source.util.Trees;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.lang.model.element.Element;
import javax.lang.model.element.ElementKind;
import javax.lang.model.element.ExecutableElement;
import javax.lang.model.element.TypeElement;
import javax.lang.model.type.TypeMirror;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;

public final class RenameBOverloads {
  private record Edit(int start, int end, String replacement) {}

  public static void main(String[] args) throws Exception {
    if (args.length != 3) throw new IllegalArgumentException("source-dir output-dir classpath");
    Path sourceDir = Path.of(args[0]).toAbsolutePath();
    Path outputDir = Path.of(args[1]).toAbsolutePath();
    Files.createDirectories(outputDir);

    List<Path> paths = List.of(sourceDir.resolve("a.java"), sourceDir.resolve("b.java"), sourceDir.resolve("GradiusNeo.java"));
    JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
    try (StandardJavaFileManager files = compiler.getStandardFileManager(null, null, StandardCharsets.UTF_8)) {
      Iterable<? extends JavaFileObject> units = files.getJavaFileObjectsFromPaths(paths);
      JavacTask task = (JavacTask) compiler.getTask(null, files, null, List.of("-proc:none", "-classpath", args[2]), null, units);
      List<CompilationUnitTree> parsed = new ArrayList<>();
      task.parse().forEach(parsed::add);
      task.analyze();

      Trees trees = Trees.instance(task);
      SourcePositions positions = trees.getSourcePositions();
      CompilationUnitTree bUnit = parsed.stream()
          .filter(unit -> unit.getSourceFile().getName().endsWith("/b.java"))
          .findFirst().orElseThrow();
      String source = Files.readString(sourceDir.resolve("b.java"));

      Map<String, Integer> counts = new HashMap<>();
      new TreePathScanner<Void, Void>() {
        @Override public Void visitMethod(MethodTree tree, Void unused) {
          Element element = trees.getElement(getCurrentPath());
          if (element instanceof ExecutableElement executable && ownerIsB(executable)) {
            counts.merge(executable.getSimpleName().toString(), 1, Integer::sum);
          }
          return super.visitMethod(tree, unused);
        }
      }.scan(bUnit, null);
      Set<String> overloaded = new HashSet<>();
      counts.forEach((name, count) -> { if (count > 1) overloaded.add(name); });

      List<Edit> edits = new ArrayList<>();
      new TreePathScanner<Void, Void>() {
        @Override public Void visitMethod(MethodTree tree, Void unused) {
          Element element = trees.getElement(getCurrentPath());
          if (element instanceof ExecutableElement executable && ownerIsB(executable) && overloaded.contains(executable.getSimpleName().toString())) {
            int start = (int) positions.getStartPosition(bUnit, tree);
            int end = tree.getBody() == null ? (int) positions.getEndPosition(bUnit, tree) : (int) positions.getStartPosition(bUnit, tree.getBody());
            String header = source.substring(start, end);
            String oldName = executable.getSimpleName().toString();
            int relative = header.lastIndexOf(oldName + "(");
            if (relative < 0) throw new IllegalStateException("Cannot locate declaration " + oldName);
            edits.add(new Edit(start + relative, start + relative + oldName.length(), renamed(executable)));
          }
          return super.visitMethod(tree, unused);
        }

        @Override public Void visitMethodInvocation(MethodInvocationTree tree, Void unused) {
          Element element = trees.getElement(getCurrentPath());
          if (element instanceof ExecutableElement executable && ownerIsB(executable) && overloaded.contains(executable.getSimpleName().toString())) {
            var select = tree.getMethodSelect();
            int end = (int) positions.getEndPosition(bUnit, select);
            int start;
            if (select instanceof IdentifierTree) start = (int) positions.getStartPosition(bUnit, select);
            else if (select instanceof MemberSelectTree member) start = end - member.getIdentifier().length();
            else throw new IllegalStateException("Unsupported invocation selector " + select);
            edits.add(new Edit(start, end, renamed(executable)));
          }
          return super.visitMethodInvocation(tree, unused);
        }
      }.scan(bUnit, null);

      edits.sort(Comparator.comparingInt(Edit::start).reversed());
      StringBuilder result = new StringBuilder(source);
      for (Edit edit : edits) result.replace(edit.start(), edit.end(), edit.replacement());
      Files.writeString(outputDir.resolve("b.java"), result.toString());
      Files.copy(sourceDir.resolve("a.java"), outputDir.resolve("a.java"), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
      Files.copy(sourceDir.resolve("GradiusNeo.java"), outputDir.resolve("GradiusNeo.java"), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
      System.out.printf("Renamed %d declarations/calls across %d overloaded names%n", edits.size(), overloaded.size());
    }
  }

  private static boolean ownerIsB(ExecutableElement method) {
    Element owner = method.getEnclosingElement();
    return owner.getKind() == ElementKind.CLASS && owner.getSimpleName().contentEquals("b");
  }

  private static String renamed(ExecutableElement method) {
    StringBuilder name = new StringBuilder(method.getSimpleName()).append("__");
    if (method.getParameters().isEmpty()) return name.append("void").toString();
    for (int index = 0; index < method.getParameters().size(); index++) {
      if (index > 0) name.append('_');
      TypeMirror type = method.getParameters().get(index).asType();
      String value = type.toString().replaceAll(".*\\.", "").replace("[]", "Array").replaceAll("[^A-Za-z0-9_]", "_");
      name.append(value);
    }
    return name.toString();
  }
}
