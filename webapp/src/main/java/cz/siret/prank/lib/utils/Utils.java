package cz.siret.prank.lib.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.awt.Color;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.nio.file.CopyOption;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.Map;
import java.util.Scanner;
import java.util.function.Function;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;


public enum Utils {
    INSTANCE;

    private final transient Logger logger = LoggerFactory.getLogger(getClass());

    public void copyStream(InputStream in, OutputStream out) throws IOException {
        byte[] buffer = new byte[1024];
        int len = in.read(buffer);
        while (len != -1) {
            out.write(buffer, 0, len);
            len = in.read(buffer);
        }
    }

    public InputStream readFile(File file) throws IOException {
        logger.info("Reading file [{}]", file.getAbsolutePath());
        if (file.getName().endsWith(".gz")) {
            return new GZIPInputStream(new FileInputStream(file));
        } else {
            return new FileInputStream(file);
        }
    }

    public void deleteDirRecursively(Path dirPath) throws IOException {
        Files.walkFileTree(dirPath, new SimpleFileVisitor<Path>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                Files.delete(file);
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult postVisitDirectory(Path dir, IOException exc) throws IOException {
                Files.delete(dir);
                return FileVisitResult.CONTINUE;
            }
        });
    }

    public Path copyFileToDir(File file, Path destDir, CopyOption... copyOptions) throws
            IOException {
        Path sourceFile = Paths.get(file.getAbsolutePath());
        Path destFile = destDir.resolve(file.getName());
        Files.copy(sourceFile, destFile , copyOptions);
        return destFile;
    }

    public void gzipFile(File file) throws IOException {
        Path sourceFile = Paths.get(file.getAbsolutePath());
        Path destFile = sourceFile.getParent().resolve(file.getName().concat(".gz"));
        try(OutputStream out = new GZIPOutputStream(new FileOutputStream(destFile.toFile()))) {
            Files.copy(sourceFile, out);
        }
    }

    public void gzipAndDeleteFile(File file) throws IOException {
        gzipFile(file);
        file.delete();
    }

    public void packZipArchive(ZipOutputStream outZip, File archiveToPack, String folderName) throws IOException {
        logger.info("Packing archive []", archiveToPack.getAbsolutePath());
        if (!archiveToPack.exists()) return;
        try (ZipInputStream inZip = new ZipInputStream(new FileInputStream(archiveToPack))) {
            ZipEntry inZipEntry = inZip.getNextEntry();
            while (inZipEntry != null) {
                String fileName = inZipEntry.getName();
                outZip.putNextEntry(new ZipEntry(folderName.concat("/").concat(fileName)));
                copyStream(inZip, outZip);
                outZip.closeEntry();
                inZipEntry = inZip.getNextEntry();
            }
            inZip.closeEntry();;
            inZip.close();
        }

    }

    public <K, V> Function<K, V> mapToMapper(Map<K, V> map) {
        return (chainId) -> map.getOrDefault(chainId, null);
    }

    // http://stackoverflow.com/questions/309424/read-convert-an-inputstream-to-a-string
    // The stream is not closed.
    public String convertStreamToString(InputStream is, boolean close) {
        Scanner s = new Scanner(is).useDelimiter("\\A");
        String res = s.hasNext() ? s.next() : "";
        if (close) {
            s.close();
        }
        return res;
    }

    public void stringToFile(String content, File destination, boolean append, boolean newline)
            throws FileNotFoundException {
        try(PrintWriter writer = new PrintWriter(new FileOutputStream(destination, append))) {
            if (newline) {
                writer.println(content);
            } else {
                writer.print(content);
            }
        }
    }

    public void stringToGZipFile(String content, File destination)
            throws IOException {
        try (OutputStream stream = new GZIPOutputStream(new FileOutputStream(destination))) {
            try (PrintWriter writer = new PrintWriter(stream)) {
                writer.print(content);
            }
        }
    }

    // http://stackoverflow.com/questions/340209/generate-colors-between-red-and-green-for-a-power-meter
    private Color getColor (double power) {
        double H = power * 0.5;
        return Color.getHSBColor((float)H, (float)0.9, (float)0.9);
    }

}
