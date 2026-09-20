# -*- coding: utf-8 -*-
import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_shading(cell, color_hex):
    """Memberikan background color pada cell tabel."""
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    """Mengatur padding dalam cell tabel (dalam dxa, 20 dxa = 1 pt)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="D1D5DB", sz="4", val="single"):
    """Memberikan border minimalis tipis pada tabel (ramah cetak)."""
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:left w:val="none"/>
            <w:right w:val="none"/>
            <w:insideV w:val="none"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)

def add_callout(doc, title, text, box_type="tips"):
    """Menambahkan kotak callout / tips operasional berdesain minimalis ramah cetak."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.2)
    
    bg_color = "F9FAFB" if box_type == "tips" else "F3F4F6"
    border_color = "6B7280" if box_type == "tips" else "374151"
    
    set_cell_shading(cell, bg_color)
    set_cell_margins(cell, top=100, bottom=100, left=160, right=160)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>
            <w:top w:val="none"/>
            <w:right w:val="none"/>
            <w:bottom w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    
    prefix = "[TIPS OPERASIONAL]" if box_type == "tips" else "[CATATAN PENTING / PERINGATAN]"
    run_prefix = p.add_run(f"{prefix} {title}\n")
    run_prefix.bold = True
    run_prefix.font.name = "Calibri"
    run_prefix.font.size = Pt(9.5)
    run_prefix.font.color.rgb = RGBColor(0x11, 0x18, 0x27)
    
    run_text = p.add_run(text)
    run_text.font.name = "Calibri"
    run_text.font.size = Pt(9.5)
    run_text.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
    
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(0)
    p_after.paragraph_format.space_after = Pt(4)

def add_image_figure(doc, img_path, caption_text, width_in=6.0):
    """Menyematkan screenshot dengan format rapi dan caption di bawahnya."""
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(2)
        run_img = p_img.add_run()
        run_img.add_picture(img_path, width=Inches(width_in))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(0)
        p_cap.paragraph_format.space_after = Pt(8)
        run_cap = p_cap.add_run(caption_text)
        run_cap.font.name = "Calibri"
        run_cap.font.size = Pt(9)
        run_cap.italic = True
        run_cap.font.color.rgb = RGBColor(0x4B, 0x55, 0x63)
    else:
        p_err = doc.add_paragraph()
        run_err = p_err.add_run(f"[File Gambar Belum Ada: {os.path.basename(img_path)}]")
        run_err.font.color.rgb = RGBColor(0xDC, 0x26, 0x26)

def add_table_data(doc, headers, rows_data, col_widths=None):
    """Menambahkan tabel data rapi dengan header abu-abu tipis (print-friendly)."""
    table = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    set_table_borders(table, color="D1D5DB", sz="4")
    
    hdr_cells = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr_cells[i].text = h
        set_cell_shading(hdr_cells[i], "F3F4F6")
        set_cell_margins(hdr_cells[i], top=80, bottom=80, left=100, right=100)
        p = hdr_cells[i].paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.15
        for run in p.runs:
            run.bold = True
            run.font.name = "Calibri"
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(0x11, 0x18, 0x27)
            
    for r_idx, row in enumerate(rows_data):
        row_cells = table.rows[r_idx + 1].cells
        bg = "FFFFFF" if r_idx % 2 == 0 else "FAFAFA"
        for c_idx, val in enumerate(row):
            row_cells[c_idx].text = str(val)
            set_cell_shading(row_cells[c_idx], bg)
            set_cell_margins(row_cells[c_idx], top=60, bottom=60, left=100, right=100)
            p = row_cells[c_idx].paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.15
            for run in p.runs:
                run.font.name = "Calibri"
                run.font.size = Pt(9.5)
                run.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
                
    if col_widths:
        for row in table.rows:
            for i, w in enumerate(col_widths):
                row.cells[i].width = Inches(w)
                
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(0)
    p_after.paragraph_format.space_after = Pt(4)

def add_heading_1(doc, text):
    """Bab Utama"""
    h = doc.add_heading(level=1)
    h.paragraph_format.space_before = Pt(16)
    h.paragraph_format.space_after = Pt(6)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(15)
    run.bold = True
    run.font.color.rgb = RGBColor(0x11, 0x18, 0x27)
    return h

def add_heading_2(doc, text):
    """Sub-bab"""
    h = doc.add_heading(level=2)
    h.paragraph_format.space_before = Pt(12)
    h.paragraph_format.space_after = Pt(4)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(12)
    run.bold = True
    run.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
    return h

def add_heading_3(doc, text):
    """Sub sub-bab"""
    h = doc.add_heading(level=3)
    h.paragraph_format.space_before = Pt(8)
    h.paragraph_format.space_after = Pt(2)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.font.name = "Calibri"
    run.font.size = Pt(10.5)
    run.bold = True
    run.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
    return h

def add_paragraph(doc, text, bold_prefix=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.bold = True
        r_pre.font.name = "Calibri"
        r_pre.font.size = Pt(10)
        r_pre.font.color.rgb = RGBColor(0x11, 0x18, 0x27)
    r_txt = p.add_run(text)
    r_txt.font.name = "Calibri"
    r_txt.font.size = Pt(10)
    r_txt.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
    return p

def add_step(doc, num, title, description):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    
    r_num = p.add_run(f"Langkah {num}: {title}\n")
    r_num.bold = True
    r_num.font.name = "Calibri"
    r_num.font.size = Pt(10)
    r_num.font.color.rgb = RGBColor(0x11, 0x18, 0x27)
    
    r_desc = p.add_run(description)
    r_desc.font.name = "Calibri"
    r_desc.font.size = Pt(10)
    r_desc.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
    return p

def main():
    print("Membuat dokumen Word Buku Panduan...")
    doc = Document()
    
    # Atur Margin Halaman Standar (1 inci / 2.54 cm)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        section.page_width = Inches(8.27)  # A4
        section.page_height = Inches(11.69)
        
    img_dir = os.path.join(os.path.dirname(__file__), "public", "docs-screenshots")
    
    # -------------------------------------------------------------
    # 1. HALAMAN COVER MINIMALIS
    # -------------------------------------------------------------
    p_cover_space = doc.add_paragraph()
    p_cover_space.paragraph_format.space_before = Pt(72)
    
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(8)
    r_t = p_title.add_run("BUKU PANDUAN PENGGUNAAN\nSISTEM PEMBUKUAN & MANAJEMEN INVENTORI")
    r_t.font.name = "Calibri"
    r_t.font.size = Pt(22)
    r_t.bold = True
    r_t.font.color.rgb = RGBColor(0x11, 0x18, 0x27)
    
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(24)
    r_sub = p_sub.add_run("Panduan Operasional Lengkap Admin & Kasir Toko\nKalkulasi HPP Berbasis BOM, Produksi Batch, dan Rekonsiliasi Shopee")
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(12)
    r_sub.font.color.rgb = RGBColor(0x4B, 0x55, 0x63)
    
    # Divider line
    p_line = doc.add_paragraph()
    p_line.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_line.paragraph_format.space_after = Pt(72)
    r_line = p_line.add_run("____________________________________________________")
    r_line.font.color.rgb = RGBColor(0x9C, 0xA3, 0xAF)
    
    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_after = Pt(4)
    r_meta1 = p_meta.add_run("UMKM KERAJINAN TANGAN CRAFTBYHANIFA\n")
    r_meta1.bold = True
    r_meta1.font.size = Pt(11)
    r_meta1.font.color.rgb = RGBColor(0x11, 0x18, 0x27)
    
    r_meta2 = p_meta.add_run("Desa Bogem, Kecamatan Kawedanan, Kabupaten Magetan, Jawa Timur\n")
    r_meta2.font.size = Pt(10)
    r_meta2.font.color.rgb = RGBColor(0x4B, 0x55, 0x63)
    
    r_meta3 = p_meta.add_run("Dokumen Versi 1.0 — September 2026")
    r_meta3.font.size = Pt(9.5)
    r_meta3.italic = True
    r_meta3.font.color.rgb = RGBColor(0x6B, 0x72, 0x80)
    
    doc.add_page_break()
    
    # -------------------------------------------------------------
    # 2. KATA PENGANTAR & KARAKTERISTIK SISTEM
    # -------------------------------------------------------------
    add_heading_1(doc, "Sekilas Sistem Pembukuan CraftByHanifa")
    add_paragraph(doc, "Sistem Pembukuan dan Manajemen Inventori CraftByHanifa merupakan aplikasi berbasis web yang dirancang khusus untuk mendukung kegiatan operasional, akuntansi HPP (Harga Pokok Penjualan/Produksi), manajemen stok bahan baku, dan rekonsiliasi transaksi penjualan kerajinan tangan CraftByHanifa di Desa Bogem, Magetan, Jawa Timur.")
    
    add_paragraph(doc, "Karakteristik utama usaha kerajinan CraftByHanifa memadukan dua model alur stok yang berjalan berdampingan:", "Dua Mode Produksi Utama: ")
    
    mode_table_headers = ["Mode Produksi", "Karakteristik Produk", "Alur Pemotongan Bahan Baku", "Contoh Produk"]
    mode_table_rows = [
        [
            "STOCK_BASED\n(Produk Siap Jual)",
            "Produk memiliki variasi tetap dan distok di muka secara batch sebelum ada pembeli.",
            "Bahan baku dipotong saat proses 'Produksi Batch' dieksekusi di studio. Menghasilkan stok barang jadi di gudang.",
            "Lilin Aromaterapi Gelas 60ml, Tungku Keramik, Casing Polos."
        ],
        [
            "MADE_TO_ORDER\n(Produk Kustom)",
            "Dibuat khusus sesuai pesanan pembeli (nama, inisial, warna glitter, foto). Tidak ada stok barang jadi.",
            "Bahan baku dipotong LANGSUNG dari resep BOM saat transaksi kasir atau impor Shopee disimpan.",
            "Gantungan Kunci Huruf Resin Custom, Pouch Sablon Custom Nama, Casing Bunga Kering."
        ]
    ]
    add_table_data(doc, mode_table_headers, mode_table_rows, [1.4, 1.6, 1.8, 1.4])
    
    add_callout(doc, "Prinsip Snapshot HPP Terkunci", 
                "Harga pokok penjualan (HPP) setiap transaksi dikunci secara permanen (snapshot) saat transaksi dibuat. Kenaikan harga bahan baku di supplier pada masa depan TIDAK AKAN mengubah laporan laba kotor transaksi di masa lampau.", 
                "important")
    
    doc.add_page_break()
    
    # -------------------------------------------------------------
    # 3. DAFTAR ISI
    # -------------------------------------------------------------
    add_heading_1(doc, "Daftar Isi Buku Panduan")
    
    toc_headers = ["Bab", "Topik Pembahasan", "Fokus Operasional"]
    toc_rows = [
        ["Bab I", "Akses Sistem & Pengaturan Dasar", "Login pengguna, peran Owner vs Karyawan, satuan ukur & kategori"],
        ["Bab II", "Manajemen Bahan Baku & Stok Gudang", "Pendaftaran material mentah, ambang batas minimum, stock opname"],
        ["Bab III", "Katalog Produk & Resep BOM", "Pendaftaran produk (Ready Stock vs Kustom), takaran formula, HPP live"],
        ["Bab IV", "Eksekusi Produksi Batch", "Produksi massal produk stok jadi, pre-check kecukupan bahan"],
        ["Bab V", "Transaksi Kasir POS & Pesanan Custom", "Pencatatan kasir cepat toko fisik/WA, input request nama, cetak nota"],
        ["Bab VI", "Rekonsiliasi & Impor Penjualan Shopee", "Upload laporan Excel/CSV Shopee, fuzzy matching produk, rollback"],
        ["Bab VII", "Pengeluaran Usaha & Belanja Bahan", "Pembelian bahan (Moving Weighted Average) dan beban operasional"],
        ["Bab VIII", "Laporan Keuangan & Analisis Laba Rugi", "Laporan laba rugi real-time, arus kas (cash flow), kalkulator HPP"],
        ["Bab IX", "Direktori Data Pelanggan", "Rekap riwayat belanja pembeli, preferensi produk kustom, ekspor Excel"],
        ["Lampiran", "SOP Harian & Panduan Troubleshooting", "Daftar periksa harian kasir toko dan solusi kendala stok minus"]
    ]
    add_table_data(doc, toc_headers, toc_rows, [1.0, 2.5, 2.7])
    
    doc.add_page_break()
    
    # -------------------------------------------------------------
    # BAB I: AKSES SISTEM & PENGATURAN DASAR
    # -------------------------------------------------------------
    add_heading_1(doc, "Bab I: Akses Sistem & Pengaturan Dasar")
    add_paragraph(doc, "Bab ini menjelaskan langkah awal membuka aplikasi, memahami tingkat hak akses pengguna (Role Based Access Control), membaca informasi pada Dashboard utama, dan mengonfigurasi master data satuan serta kategori.")
    
    add_heading_2(doc, "1.1 Login & Hak Akses Pengguna")
    add_paragraph(doc, "Aplikasi diamankan menggunakan autentikasi akun. Pengguna wajib memasukkan email dan kata sandi yang valid untuk dapat mengakses sistem.")
    
    add_image_figure(doc, os.path.join(img_dir, "01_login.png"), 
                     "Gambar 1.1: Halaman Masuk (Login) Sistem Pembukuan CraftByHanifa")
    
    add_step(doc, 1, "Buka Halaman Login", "Akses URL aplikasi melalui peramban web (Google Chrome atau Microsoft Edge) pada alamat http://localhost:3000/login.")
    add_step(doc, 2, "Masukkan Kredensial", "Ketikkan alamat email dan password akun Anda yang telah terdaftar.")
    add_step(doc, 3, "Klik Tombol Masuk", "Klik tombol 'Masuk ke Sistem' berwarna rose. Sistem akan memvalidasi data dan mengarahkan Anda ke Dashboard.")
    
    add_paragraph(doc, "Perbedaan Hak Akses Pengguna (Role-Based Access Control):", "Pembagian Wewenang Akun: ")
    rbac_headers = ["Peran (Role)", "Hak Akses Halaman", "Batasan / Proteksi"]
    rbac_rows = [
        [
            "OWNER\n(Pemilik Usaha)",
            "Akses PENUH ke seluruh menu sistem: Dashboard, Kasir, Bahan Baku, Produk, Produksi, Pengeluaran, Laporan Laba Rugi, Laporan Arus Kas, Simulasi HPP, Pelanggan, dan Pengaturan Sistem.",
            "Tidak ada batasan. Memiliki wewenang mengedit pengaturan sensitif dan melihat margin laba bersih usaha."
        ],
        [
            "STAFF\n(Karyawan / Kasir)",
            "Akses operasional harian: Dashboard, Transaksi Kasir, Bahan Baku (stok fisik & opname), Katalog Produk, Produksi Batch, Impor Penjualan Shopee, dan Pelanggan.",
            "DIBATASI: Tidak dapat membuka menu Laporan Laba Rugi, Laporan Arus Kas, Pengeluaran Keuangan, dan Pengaturan Sistem."
        ]
    ]
    add_table_data(doc, rbac_headers, rbac_rows, [1.4, 2.5, 2.3])
    
    add_heading_2(doc, "1.2 Pemulihan Kata Sandi Pemilik (Lupa Kata Sandi)")
    add_paragraph(doc, "Untuk menjaga keamanan dan profesionalitas toko, tombol akses cepat pengujian telah disembunyikan dari halaman login. Jika Pemilik (Owner) lupa kata sandi akunnya, sistem menyediakan fitur pemulihan mandiri menggunakan PIN Pemulihan Rahasia (Master PIN).")
    
    add_image_figure(doc, os.path.join(img_dir, "01b_modal_lupa_sandi.png"), 
                     "Gambar 1.2: Modal Pemulihan Kata Sandi Menggunakan PIN Rahasia Pemilik")
    
    add_step(doc, 1, "Klik Tombol 'Lupa kata sandi?'", "Pada formulir masuk login, klik tautan 'Lupa kata sandi?' yang terletak di sebelah kanan label Kata Sandi.")
    add_step(doc, 2, "Masukkan Email Akun Owner", "Ketikkan alamat email akun Owner Anda (default: owner@craftbyhanifa.com).")
    add_step(doc, 3, "Masukkan PIN Pemulihan Rahasia", "Ketikkan Master PIN Pemilik 6-digit (default terdaftar di sistem: 992026 atau kode rahasia yang telah Anda set).")
    add_step(doc, 4, "Tentukan Kata Sandi Baru", "Ketikkan kata sandi baru (minimal 6 karakter) dan ulangi pada kolom konfirmasi.")
    add_step(doc, 5, "Simpan Sandi Baru", "Klik tombol 'Simpan Sandi Baru'. Sistem langsung memperbarui kata sandi di database Supabase dan Anda dapat langsung login kembali.")
    
    add_callout(doc, "Kerahasiaan PIN Pemulihan Pemilik", 
                "Master PIN Pemulihan (992026) berfungsi sebagai kunci brankas darurat. Simpan nomor PIN ini di tempat aman pribadi dan jangan beritahukan kepada staf kasir. Jika staf kasir lupa sandi, minta akun Owner untuk mereset akun karyawan.", 
                "important")
    
    add_heading_2(doc, "1.3 Mengenal Antarmuka Dashboard Utama")
    add_paragraph(doc, "Dashboard merupakan pusat ringkasan metrik usaha yang memuat data penjualan hari ini, omzet bulanan, total HPP terpakai, beban studio, estimasi laba bersih, serta status peringatan stok bahan baku menipis.")
    
    add_image_figure(doc, os.path.join(img_dir, "02_dashboard.png"), 
                     "Gambar 1.3: Antarmuka Dashboard Utama dan Ringkasan Metrik Usaha")
    
    dash_headers = ["Komponen Dashboard", "Fungsi & Indikator yang Ditampilkan"]
    dash_rows = [
        ["Kartu Omzet Bulan Ini", "Menampilkan total akumulasi nilai penjualan yang berhasil dicatat dari Shopee dan kasir offline pada bulan berjalan."],
        ["Kartu Total HPP Terpakai", "Nilai akumulasi biaya bahan baku yang dikeluarkan untuk produk-produk yang terjual pada bulan berjalan."],
        ["Kartu Beban Operasional", "Total biaya operasional studio (kemasan, listrik, perlengkapan studio, promosi)."],
        ["Kartu Laba Bersih & Margin", "Estimasi keuntungan bersih (Omzet dikurangi HPP dan Beban Operasional) beserta persentase Net Margin."],
        ["Kontribusi Kanal Penjualan", "Grafik pembanding antara transaksi penjualan kanal Shopee vs Kasir Offline vs WhatsApp Direct."],
        ["Peringatan Stok Menipis", "Daftar bahan baku atau produk yang stoknya telah berada di bawah batas minimum dan butuh restock segera."]
    ]
    add_table_data(doc, dash_headers, dash_rows, [2.0, 4.2])
    
    add_heading_2(doc, "1.4 Pengaturan Master Satuan & Kategori Produk")
    add_paragraph(doc, "Sebelum menginput bahan baku atau produk baru, pastikan satuan takaran terkecil dan kelompok kategori telah didaftarkan pada menu Pengaturan.")
    
    add_image_figure(doc, os.path.join(img_dir, "03_pengaturan.png"), 
                     "Gambar 1.4: Halaman Pengaturan Master Satuan Ukur dan Kategori Produk")
    
    add_step(doc, 1, "Buka Menu Pengaturan", "Klik menu 'Pengaturan' pada sidebar sebelah kiri (khusus akun Owner).")
    add_step(doc, 2, "Kelola Satuan Bahan", "Periksa daftar satuan yang tersedia (gram, ml, pcs, lembar, meter). Jika membutuhkan satuan baru, klik tombol '+ Tambah Satuan'.")
    add_step(doc, 3, "Kelola Kategori Produk", "Tambahkan kategori produk kerajinan CraftByHanifa (contoh: Gantungan Kunci, Lilin Aromaterapi, Souvenir Pouch, Casing Resin).")
    
    add_callout(doc, "Gunakan Satuan Ukur Terkecil", 
                "Selalu gunakan satuan ukur terkecil yang dipakai saat meracik produk. Sebagai contoh: gunakan satuan 'gram' alih-alih 'kg' jika resin ditakar per gram pada resep produk.", 
                "tips")
    
    doc.add_page_break()
    
    # -------------------------------------------------------------
    # BAB II: MANAJEMEN BAHAN BAKU & STOK GUDANG
    # -------------------------------------------------------------
    add_heading_1(doc, "Bab II: Manajemen Bahan Baku & Stok Inventori")
    add_paragraph(doc, "Bahan baku merupakan pondasi utama dalam kalkulasi HPP usaha kerajinan CraftByHanifa. Modul ini digunakan untuk mendaftarkan material mentah, memantau jumlah stok fisik yang tersedia, serta melakukan stock opname penyesuaian berkala.")
    
    add_heading_2(doc, "2.1 Pendaftaran Material Mentah Baru")
    add_paragraph(doc, "Setiap material yang dibeli untuk keperluan produksi kerajinan (misal: resin epoxy, cairan hardener, soy wax flakes, fragrance oil, ring gantungan kunci, kain blacu) wajib didaftarkan terlebih dahulu.")
    
    add_image_figure(doc, os.path.join(img_dir, "04_bahan_baku.png"), 
                     "Gambar 2.1: Daftar Bahan Baku & Stok Inventori Gudang")
    
    add_step(doc, 1, "Masuk ke Menu Bahan Baku", "Klik menu 'Bahan Baku & Stok' pada sidebar grup 'Produk & Produksi'.")
    add_step(doc, 2, "Klik Tambah Bahan", "Klik tombol '+ Tambah Bahan Baku' di pojok kanan atas.")
    add_step(doc, 3, "Isi Formulir Bahan Baku", "Lengkapi kolom Nama Bahan, Kode SKU (opsional), Satuan Ukur, Stok Awal, Harga Beli Rata-rata per Satuan, dan Ambang Batas Minimum.")
    add_step(doc, 4, "Simpan Data", "Klik tombol 'Simpan Bahan Baku'. Data bahan akan langsung muncul pada tabel stok inventori.")
    
    raw_field_headers = ["Kolom Formulir", "Keterangan & Petunjuk Pengisian"]
    raw_field_rows = [
        ["Nama Bahan Baku", "Nama spesifik material (contoh: 'Resin Bening Epoxy Part A', 'Bibit Parfum Lavender', 'Ring Kunci Silver 25mm')."],
        ["Kode SKU", "Kode unik penanda material di rak gudang (contoh: 'RSN-A01', 'OIL-LAV'). Dapat dikosongkan jika belum ada."],
        ["Satuan Pengukuran", "Pilih satuan sesuai takaran resep (gram, ml, pcs, meter, lembar)."],
        ["Stok Fisik Awal", "Jumlah kuantitas material yang secara nyata ada di studio saat sistem mulai digunakan."],
        ["Harga Rata-rata (HPP Satuan)", "Harga pokok per satu unit satuan (misal: Rp 120 per gram untuk resin epoxy)."],
        ["Batas Minimum (Alert)", "Jumlah ambang batas minimum. Jika stok fisik turun di bawah angka ini, sistem otomatis menampilkan tanda peringatan merah."]
    ]
    add_table_data(doc, raw_field_headers, raw_field_rows, [2.0, 4.2])
    
    add_heading_2(doc, "2.2 Melakukan Stock Opname Fisik")
    add_paragraph(doc, "Stock Opname dilakukan secara periodik untuk menyinkronkan stok tercatat di komputer dengan kondisi fisik di gudang, terutama jika terjadi bahan tumpah, susut menguap, atau material cacat.")
    
    add_step(doc, 1, "Pilih Bahan yang Akan Di-opname", "Pada baris bahan yang ingin disesuaikan di tabel, klik tombol 'Opname'.")
    add_step(doc, 2, "Input Jumlah Fisik Sebenarnya", "Ketikkan angka hasil hitungan fisik riil di studio ke kolom 'Stok Fisik Nyata'.")
    add_step(doc, 3, "Berikan Alasan Koreksi", "Pilih atau tulis keterangan penyesuaian (contoh: 'Bahan tumpah saat pengerjaan', 'Koreksi hitungan fisik bulanan').")
    add_step(doc, 4, "Konfirmasi Opname", "Klik tombol 'Simpan Koreksi'. Stok sistem akan langsung diperbarui dan riwayat opname tercatat di audit log.")
    
    add_callout(doc, "Lakukan Opname Rutin Tiap Akhir Pekan", 
                "Lakukan penimbangan fisik resin dan penghitungan ring kunci setiap akhir pekan agar akurasi pemotongan stok otomatis tetap terjaga sempurna.", 
                "tips")
    
    doc.add_page_break()
    
    # -------------------------------------------------------------
    # BAB III: KATALOG PRODUK & RESEP BOM
    # -------------------------------------------------------------
    add_heading_1(doc, "Bab III: Katalog Produk & Perumusan Resep BOM")
    add_paragraph(doc, "Bill of Materials (BOM) adalah daftar formula yang merinci kebutuhan bahan baku beserta takarannya untuk menghasilkan satu unit produk kerajinan. Melalui resep BOM, sistem secara otomatis menghitung Harga Pokok Penjualan (HPP) live.")
    
    add_heading_2(doc, "3.1 Pendaftaran Produk Baru & Penentuan Mode Produksi")
    add_paragraph(doc, "Setiap karya kerajinan yang dijual oleh CraftByHanifa didaftarkan sebagai SKU produk pada katalog.")
    
    add_image_figure(doc, os.path.join(img_dir, "05_produk.png"), 
                     "Gambar 3.1: Halaman Katalog Produk Kerajinan CraftByHanifa")
    
    add_step(doc, 1, "Buka Menu Produk", "Klik menu 'Produk' pada navigasi sidebar.")
    add_step(doc, 2, "Klik Tambah Produk Baru", "Klik tombol '+ Tambah Produk Baru'.")
    add_step(doc, 3, "Tentukan Mode Produksi", "Pilih apakah produk bertipe 'MADE_TO_ORDER (Kustom Pesanan)' atau 'STOCK_BASED (Stok Jadi Siap Kirim)'.")
    add_step(doc, 4, "Isi Rincian Produk", "Lengkapi Nama Produk, Kategori, Harga Jual Standar, dan Deskripsi Produk.")
    
    prod_field_headers = ["Kolom Formulir", "Aturan Pengisian & Keterangan"]
    prod_field_rows = [
        ["Nama Produk", "Nama lengkap produk (contoh: 'Gantungan Kunci Huruf Resin Custom', 'Lilin Aromaterapi Lavender 60ml')."],
        ["Kategori Produk", "Kategori pengelompokan yang sudah disetup di menu Pengaturan."],
        ["Mode Produksi", "MADE_TO_ORDER (bahan dipotong saat pesanan masuk) ATAU STOCK_BASED (bahan dipotong saat proses batch produksi)."],
        ["Harga Jual (Rp)", "Harga jual standar produk kepada pelanggan sebelum diskon."],
        ["Estimasi HPP (Live)", "Otomatis terisi dari penjumlahan total biaya bahan baku pada resep BOM."]
    ]
    add_table_data(doc, prod_field_headers, prod_field_rows, [2.0, 4.2])
    
    add_heading_2(doc, "3.2 Merumuskan Resep Komposisi BOM (Bill of Materials)")
    add_paragraph(doc, "Resep komposisi menentukan berapa banyak gram, ml, atau pcs bahan baku yang dikonsumsi dalam pembuatan 1 unit produk kerajinan.")
    
    add_image_figure(doc, os.path.join(img_dir, "06_resep_bom.png"), 
                     "Gambar 3.2: Daftar Resep Komposisi BOM dan Kalkulasi HPP per Produk")
    
    add_step(doc, 1, "Buka Menu Resep BOM", "Klik menu 'Resep BOM' pada sidebar, lalu klik tombol 'Ubah Resep' pada produk terkait.")
    add_step(doc, 2, "Tambah Baris Bahan Baku", "Klik '+ Tambah Bahan' untuk memilih bahan baku yang dibutuhkan dari daftar master.")
    add_step(doc, 3, "Tentukan Takaran Jumlah per Unit", "Masukkan jumlah takaran kebutuhan (contoh: 25 gram resin, 1 pcs ring gantungan, 2 gram foil emas).")
    add_step(doc, 4, "Lihat Estimasi Biaya HPP Live", "Sistem langsung menampilkan kalkulasi total biaya bahan: Takaran dikalikan Harga Rata-rata Bahan Baku.")
    add_step(doc, 5, "Simpan Resep", "Klik tombol 'Simpan Resep BOM'. Formula ini akan menjadi dasar pemotongan stok otomatis.")
    
    add_callout(doc, "Pembaruan Resep Mengikuti Kenaikan Harga", 
                "Jika supplier menaikkan harga material, nilai estimasi HPP di halaman Resep BOM akan otomatis menyesuaikan secara live tanpa perlu Anda ubah secara manual.", 
                "tips")
    
    doc.add_page_break()
    
    # -------------------------------------------------------------
    # BAB IV: EKSEKUSI PRODUKSI BATCH
    # -------------------------------------------------------------
    add_heading_1(doc, "Bab IV: Eksekusi Produksi Batch (Produk Siap Jual)")
    add_paragraph(doc, "Modul Produksi Batch khusus digunakan untuk produk-produk dengan mode 'STOCK_BASED' (produk standar siap jual). Proses ini memotong bahan baku mentah dalam jumlah banyak sekaligus dan menambahkan stok produk jadi ke inventori siap kirim.")
    
    add_image_figure(doc, os.path.join(img_dir, "07_produksi.png"), 
                     "Gambar 4.1: Antarmuka Modul Eksekusi Produksi Batch")
    
    add_heading_2(doc, "4.1 Langkah Mencatat Produksi Batch")
    add_step(doc, 1, "Buka Menu Produksi Batch", "Klik menu 'Produksi Batch' pada navigasi sidebar.")
    add_step(doc, 2, "Klik Buat Batch Produksi", "Klik tombol '+ Mulai Produksi Batch' di pojok kanan atas.")
    add_step(doc, 3, "Pilih Produk Jadi", "Pilih produk stok jadi yang sedang diproduksi di studio (misal: 'Lilin Aromaterapi Lavender Gelas 60ml').")
    add_step(doc, 4, "Tentukan Target Kuantitas Jadi", "Masukkan jumlah unit yang akan diproduksi (contoh: 20 pcs).")
    add_step(doc, 5, "Pemeriksaan Ketersediaan Bahan (Pre-check)", "Sistem otomatis mengalikan target unit dengan resep BOM dan memeriksa apakah seluruh stok bahan mentah mencukupi.")
    add_step(doc, 6, "Konfirmasi & Eksekusi", "Jika semua indikator berwarna hijau (stok cukup), klik 'Konfirmasi & Potong Bahan'. Sistem memotong bahan mentah dan menambah 20 pcs ke stok produk jadi.")
    
    add_callout(doc, "Pencegahan Kerusakan Data (Pre-Check Validasi)", 
                "Sistem secara ketat melarang eksekusi batch produksi jika ada salah satu bahan baku yang stok fisiknya tidak mencukupi. Hal ini mencegah stok bahan minus di gudang.", 
                "important")
    
    doc.add_page_break()
    
    # -------------------------------------------------------------
    # BAB V: TRANSAKSI KASIR POS & PESANAN OFFLINE
    # -------------------------------------------------------------
    add_heading_1(doc, "Bab V: Transaksi Kasir POS & Pesanan Custom")
    add_paragraph(doc, "Modul Kasir POS (Point of Sale) dirancang untuk mencatat pesanan yang datang langsung ke toko fisik CraftByHanifa di Desa Bogem, pemesanan via WhatsApp, serta pesanan suvenir dalam jumlah banyak.")
    
    add_heading_2(doc, "5.1 Riwayat Transaksi Penjualan")
    add_paragraph(doc, "Halaman riwayat transaksi menampilkan daftar seluruh pesanan yang masuk dari seluruh kanal (Shopee, Kasir Offline, WhatsApp), lengkap dengan status pembayaran, nilai belanja, dan snapshot HPP.")
    
    add_image_figure(doc, os.path.join(img_dir, "08_transaksi.png"), 
                     "Gambar 5.1: Riwayat Transaksi Penjualan Gabungan Seluruh Kanal")
    
    add_heading_2(doc, "5.2 Alur Pembuatan Transaksi Baru di Kasir")
    add_paragraph(doc, "Untuk melayani pembeli yang datang ke toko atau memesan via WhatsApp:")
    
    add_image_figure(doc, os.path.join(img_dir, "09_kasir_pos.png"), 
                     "Gambar 5.2: Formulir Kasir POS Cepat & Input Pesanan Kustom")
    
    add_step(doc, 1, "Buka Form Kasir Baru", "Klik tombol '+ Kasir Offline' di pojok kanan atas atau buka menu 'Transaksi Penjualan' -> '+ Kasir Cepat'.")
    add_step(doc, 2, "Isi Identitas Pelanggan", "Ketik Nama Pembeli dan Nomor WhatsApp (opsional namun sangat dianjurkan untuk penyimpanan database pelanggan).")
    add_step(doc, 3, "Pilih Produk yang Dibeli", "Pilih produk dari dropdown. Jika produk bertipe 'MADE_TO_ORDER', muncul kolom 'Catatan Kustom' (masukkan tulisan nama pesanan, inisial huruf, atau pilihan warna glitter).")
    add_step(doc, 4, "Tentukan Jumlah & Diskon / Ongkir", "Atur kuantitas barang, masukkan nilai diskon jika ada promo, serta masukkan biaya ongkos kirim jika diantar.")
    add_step(doc, 5, "Pilih Metode Pembayaran", "Pilih opsi: 'Tunai / Cash', 'QRIS', atau 'Transfer Bank'.")
    add_step(doc, 6, "Simpan & Cetak Nota", "Klik tombol 'Simpan & Cetak Nota'. Sistem langsung mengunci snapshot HPP, memotong stok terkait, dan membuka dialog cetak nota belanja.")
    
    pos_field_headers = ["Bagian Formulir", "Penjelasan Fungsi"]
    pos_field_rows = [
        ["Nama Pelanggan", "Nama pembeli perorangan atau instansi pemesan suvenir."],
        ["Nomor WhatsApp", "Nomor WA pelanggan. Nomor ini otomatis tersimpan ke direktori buku kontak pelanggan."],
        ["Catatan Kustom Produk", "Khusus pesanan kustom (misal: 'Huruf N, warna Lilac, foil emas, glitter bintang'). Catatan ini dicetak di struk workshop."],
        ["Metode Pembayaran", "Kanal kas tempat uang masuk (Tunai Kasir, Rekening Transfer Bank, atau Saldo QRIS)."],
        ["Tombol Simpan & Cetak", "Menyimpan transaksi ke database, memotong bahan baku, dan mencetak faktur struk belanja."]
    ]
    add_table_data(doc, pos_field_headers, pos_field_rows, [2.0, 4.2])
    
    doc.add_page_break()
    
    # -------------------------------------------------------------
    # BAB VI: REKONSILIASI & IMPOR PENJUALAN SHOPEE
    # -------------------------------------------------------------
    add_heading_1(doc, "Bab VI: Rekonsiliasi & Impor Penjualan Shopee")
    add_paragraph(doc, "Bagi pesanan yang berasal dari marketplace Shopee, admin tidak perlu menginput transaksi satu per satu secara manual. Sistem menyediakan modul impor cerdas untuk membaca file laporan pesanan dari Shopee Seller Center.")
    
    add_image_figure(doc, os.path.join(img_dir, "10_import_shopee.png"), 
                     "Gambar 6.1: Antarmuka Impor Data Penjualan Shopee Cerdas")
    
    add_heading_2(doc, "6.1 Langkah Ekspor dari Shopee Seller Center")
    add_step(doc, 1, "Masuk ke Shopee Seller Center", "Buka browser dan login ke akun toko Shopee CraftByHanifa.")
    add_step(doc, 2, "Buka Menu Pesanan Saya", "Masuk ke menu 'Pesanan Saya' -> tab 'Selesai' (atau tab pesanan yang sudah dikirim).")
    add_step(doc, 3, "Klik Tombol Ekspor", "Pilih rentang tanggal (misal: 1 bulan terakhir) lalu klik 'Export' untuk mengunduh file berekstensi .xlsx atau .csv.")
    
    add_heading_2(doc, "6.2 Langkah Impor ke Sistem Pembukuan")
    add_step(doc, 1, "Buka Menu Impor Shopee", "Pada sidebar sistem CraftByHanifa, klik menu 'Impor Shopee'.")
    add_step(doc, 2, "Unggah File Laporan", "Klik tombol 'Pilih File Shopee (.xlsx / .csv)' dan pilih berkas yang baru saja diunduh dari Shopee.")
    add_step(doc, 3, "Proses Fuzzy Matching Produk", "Sistem secara otomatis mendeteksi nama produk Shopee dan mencocokkannya dengan produk di katalog lokal.")
    add_step(doc, 4, "Konfirmasi Pemetaan Nama", "Jika ada nama produk yang belum cocok 100%, sistem akan meminta konfirmasi manual satu kali saja. Pilihan Anda akan diingat untuk impor berikutnya.")
    add_step(doc, 5, "Eksekusi Impor Pesanan", "Klik tombol 'Konfirmasi Impor'. Seluruh pesanan Shopee akan masuk ke riwayat transaksi dan memotong stok bahan baku.")
    
    add_callout(doc, "Fitur Rollback Instan (Batalkan Impor)", 
                "Jika Anda salah mengunggah file bulan yang keliru, Anda dapat mengklik tombol 'Lihat Riwayat & Audit Impor' lalu klik 'Rollback'. Seluruh data transaksi dari file tersebut akan dihapus dan stok bahan baku dikembalikan secara otomatis seperti semula.", 
                "important")
    
    doc.add_page_break()
    
    # -------------------------------------------------------------
    # BAB VII: PENGELUARAN USAHA & BELANJA BAHAN
    # -------------------------------------------------------------
    add_heading_1(doc, "Bab VII: Pengeluaran Usaha & Belanja Bahan Baku")
    add_paragraph(doc, "Arus kas keluar (biaya) dikelompokkan menjadi dua kategori: Pembelian Bahan Baku (menambah aset persediaan dan memperbarui HPP rata-rata) serta Beban Operasional Studio (biaya rutin yang langsung menjadi pengurang laba).")
    
    add_image_figure(doc, os.path.join(img_dir, "11_pengeluaran.png"), 
                     "Gambar 7.1: Ringkasan Pengeluaran & Belanja Usaha")
    
    add_heading_2(doc, "7.1 Pencatatan Pembelian Bahan Baku (Moving Weighted Average)")
    add_paragraph(doc, "Setiap kali membeli bahan baku baru dari toko kimia, toko kain, atau supplier online, catat pada formulir pembelian ini.")
    
    add_image_figure(doc, os.path.join(img_dir, "12_beli_bahan.png"), 
                     "Gambar 7.2: Formulir Pencatatan Pembelian Bahan Baku Supplier")
    
    add_step(doc, 1, "Buka Form Belanja Bahan", "Klik tombol '+ Beli Bahan Baku' pada menu Pengeluaran.")
    add_step(doc, 2, "Pilih Toko / Supplier", "Masukkan nama toko/supplier tempat berbelanja (misal: 'Toko Kimia Jaya Surabaya').")
    add_step(doc, 3, "Pilih Bahan & Kuantitas Beli", "Pilih bahan baku, masukkan kuantitas yang dibeli, dan ketik harga beli per unitnya.")
    add_step(doc, 4, "Simulasi Harga Rata-Rata Otomatis", "Sistem langsung menampilkan simulasi stok sebelum dan sesudah, serta harga pokok rata-rata baru.")
    add_step(doc, 5, "Simpan & Tambah Stok", "Klik tombol 'Simpan & Tambah Stok'. Saldo kas keluar bertambah, stok bertambah, dan harga HPP diperbarui.")
    
    add_callout(doc, "Rumus Moving Weighted Average yang Diterapkan Sistem", 
                "newAvgCost = [ (Stok Lama x Harga Lama) + (Qty Beli x Harga Beli) ] / (Stok Lama + Qty Beli).\nDengan rumus ini, harga pokok produksi selalu mencerminkan nilai wajar rata-rata riil dari seluruh persediaan yang Anda miliki.", 
                "tips")
    
    add_heading_2(doc, "7.2 Pencatatan Beban Operasional Usaha")
    add_paragraph(doc, "Beban operasional adalah biaya yang dikeluarkan bukan untuk membeli bahan baku, melainkan untuk mendukung kelancaran operasional usaha. Contoh kategori beban:")
    
    expense_headers = ["Kategori Beban", "Contoh Pengeluaran Studio", "Dampak ke Pembukuan"]
    expense_rows = [
        ["Kemasan & Packing", "Kardus die-cut mini, bubble wrap, stiker fragile, pita satin pengikat.", "Pengurang Laba Bersih di Laporan Laba Rugi."],
        ["Utilitas Studio", "Tagihan listrik workshop, air, pulsa / kuota internet toko.", "Pengurang Laba Bersih & Pengeluaran Arus Kas."],
        ["Iklan & Promosi", "Biaya top up Saldo Iklan Shopee, Facebook/Instagram Ads.", "Pengurang Laba Bersih di Laporan Laba Rugi."],
        ["Peralatan & Tools", "Cetakan silikon mold resin baru, kuas, timbangan digital, pinset.", "Pengeluaran Kas."],
        ["Ongkir Talangan", "Biaya pengiriman kurir yang ditalangi lebih dulu sebelum dibayar pembeli.", "Arus Kas Keluar."]
    ]
    add_table_data(doc, expense_headers, expense_rows, [1.8, 2.5, 1.9])
    
    doc.add_page_break()
    
    # -------------------------------------------------------------
    # BAB VIII: LAPORAN KEUANGAN & ANALISIS LABA RUGI
    # -------------------------------------------------------------
    add_heading_1(doc, "Bab VIII: Laporan Keuangan & Analisis Profitabilitas")
    add_paragraph(doc, "Laporan keuangan dihasilkan secara otomatis (real-time) dari data transaksi penjualan dan pengeluaran yang telah dicatat. Modul ini menjadi kompas utama bagi Owner CraftByHanifa dalam melihat kesehatan finansial usaha.")
    
    add_heading_2(doc, "8.1 Laporan Laba Rugi Komprehensif (Income Statement)")
    add_paragraph(doc, "Laporan Laba Rugi merinci performa usaha pada periode waktu tertentu (misal: bulan berjalan atau tahunan).")
    
    add_image_figure(doc, os.path.join(img_dir, "13_laporan_laba_rugi.png"), 
                     "Gambar 8.1: Tampilan Laporan Laba Rugi Komprehensif")
    
    add_paragraph(doc, "Struktur Perhitungan Laba Rugi Sistem CraftByHanifa:", "Alur Hitungan Akuntansi: ")
    p_eq = doc.add_paragraph()
    p_eq.paragraph_format.left_indent = Inches(0.4)
    p_eq.paragraph_format.line_spacing = 1.2
    r_eq = p_eq.add_run(
        "1. Pendapatan Penjualan Bersih (Net Revenue)\n"
        "   dikurangi: Total Harga Pokok Penjualan (HPP Bahan Baku Snapshot)\n"
        "   = Laba Kotor (Gross Profit)\n\n"
        "2. Laba Kotor (Gross Profit)\n"
        "   dikurangi: Total Beban Operasional (Kemasan + Listrik + Iklan + Studio)\n"
        "   = Laba Bersih Usaha (Net Profit)"
    )
    r_eq.font.name = "Calibri"
    r_eq.font.size = Pt(10)
    r_eq.bold = True
    r_eq.font.color.rgb = RGBColor(0x11, 0x18, 0x27)
    
    add_heading_2(doc, "8.2 Laporan Arus Kas (Cash Flow)")
    add_paragraph(doc, "Laporan arus kas memantau likuiditas uang nyata yang masuk dan keluar dari kas toko. Berbeda dengan Laba Rugi yang menganalisis laba barang terjual, Arus Kas mencatat perpindahan uang secara riil saat transaksi terjadi.")
    
    add_image_figure(doc, os.path.join(img_dir, "14_laporan_arus_kas.png"), 
                     "Gambar 8.2: Laporan Arus Kas (Cash Flow) Masuk vs Keluar")
    
    add_heading_2(doc, "8.3 Kalkulator Simulasi HPP & Rekomendasi Harga Jual")
    add_paragraph(doc, "Kalkulator ini membantu Owner dalam merencanakan produk kerajinan baru atau mengevaluasi apakah produk yang sedang dijual masih menguntungkan setelah memperhitungkan fee marketplace Shopee.")
    
    add_image_figure(doc, os.path.join(img_dir, "15_kalkulator_hpp.png"), 
                     "Gambar 8.3: Kalkulator Simulasi HPP, Potongan Fee Marketplace, dan Rekomendasi Harga Jual")
    
    calc_field_headers = ["Parameter Input Simulasi", "Keterangan & Rekomendasi Pengisian"]
    calc_field_rows = [
        ["Pilih Produk Kerajinan", "Pilih produk yang ingin disimulasikan. Biaya bahan baku otomatis terisi dari resep BOM."],
        ["Estimasi Upah Tenaga Kerja", "Biaya jasa pengerjaan per unit (misal: Rp 1.000 - Rp 2.500 untuk pengrajin)."],
        ["Estimasi Biaya Kemasan", "Biaya kardus, plastik klip, pita, dan kartu ucapan per unit (misal: Rp 500)."],
        ["Perkiraan Fee Marketplace (%)", "Persentase potongan komisi Shopee (rata-rata 6.5% - 8.5% untuk kategori kerajinan/fashion)."],
        ["Target Margin Bersih (%)", "Persentase keuntungan bersih yang diinginkan (direkomendasikan minimal 40% - 50% untuk produk handmade)."],
        ["Rekomendasi Harga Jual", "Sistem secara otomatis menghitung harga jual minimum yang harus dipasang agar target laba bersih tercapai setelah dipotong fee marketplace."]
    ]
    add_table_data(doc, calc_field_headers, calc_field_rows, [2.2, 4.0])
    
    doc.add_page_break()
    
    # -------------------------------------------------------------
    # BAB IX: DIREKTORI DATA PELANGGAN
    # -------------------------------------------------------------
    add_heading_1(doc, "Bab IX: Manajemen Data Pelanggan")
    add_paragraph(doc, "Data pelanggan merupakan aset penting bagi pertumbuhan usaha CraftByHanifa. Setiap kali terjadi transaksi penjualan kasir offline atau impor pesanan Shopee, sistem secara otomatis merangkum data pembeli ke dalam direktori pelanggan terpusat.")
    
    add_image_figure(doc, os.path.join(img_dir, "16_pelanggan.png"), 
                     "Gambar 9.1: Direktori Data Pelanggan CraftByHanifa")
    
    add_heading_2(doc, "9.1 Fitur Direktori Pelanggan")
    add_step(doc, 1, "Pencarian Kontak Cepat", "Ketik nama pelanggan atau nomor WhatsApp pada kolom pencarian untuk melihat riwayat order mereka.")
    add_step(doc, 2, "Filter Berdasarkan Kanal", "Pilih tab filter 'Semua', 'Shopee', atau 'Offline' untuk melihat asal pelanggan.")
    add_step(doc, 3, "Pantau Total Akumulasi Belanja (LTV)", "Sistem menampilkan total frekuensi order dan total uang yang telah dibelanjakan pelanggan di CraftByHanifa.")
    add_step(doc, 4, "Ekspor Data ke Excel", "Klik tombol 'Export ke Excel (.xlsx)' untuk mengunduh daftar kontak pembeli guna keperluan broadcast promo WhatsApp atau katalog suvenir baru.")
    
    add_callout(doc, "Peluang Penjualan Ulang (Repeat Order)", 
                "Gunakan nomor WhatsApp pembeli yang sudah terdata untuk mengirimkan katalog suvenir pernikahan atau hampers hari raya menjelang momen-momen spesial.", 
                "tips")
    
    doc.add_page_break()
    
    # -------------------------------------------------------------
    # LAMPIRAN: SOP HARIAN & TROUBLESHOOTING
    # -------------------------------------------------------------
    add_heading_1(doc, "Lampiran: SOP Harian & Troubleshooting")
    add_paragraph(doc, "Bagian ini memuat daftar periksa prosedur operasional standar (SOP) harian bagi admin/kasir toko serta solusi atas kendala teknis yang mungkin dihadapi saat menjalankan sistem.")
    
    add_heading_2(doc, "A. SOP Pembukaan Toko (Pagi Hari)")
    add_step(doc, 1, "Login Sistem", "Buka aplikasi di browser komputer/tablet kasir dan login menggunakan akun yang berhak.")
    add_step(doc, 2, "Cek Peringatan Stok Menipis", "Lihat kartu 'Peringatan Stok Menipis' di Dashboard. Jika ada bahan baku yang berada di ambang batas minimum, segera konfirmasikan ke tim produksi/belanja.")
    add_step(doc, 3, "Pastikan Kertas Nota Siap", "Periksa printer nota struk dan koneksi internet toko dalam keadaan aktif.")
    
    add_heading_2(doc, "B. SOP Penutupan Kasir (Sore / Malam Hari)")
    add_step(doc, 1, "Rekonsiliasi Kas Toko Fisik", "Cocokkan total uang tunai di laci kasir dengan total penjualan tunai pada filter Kasir Offline hari ini.")
    add_step(doc, 2, "Impor Pesanan Shopee", "Unduh file ekspor pesanan Shopee yang dikirim hari ini dan lakukan impor data ke sistem.")
    add_step(doc, 3, "Pencatatan Pengeluaran Harian", "Pastikan nota pembelian bensin, kemasan, atau belanja bahan hari ini telah diinput ke menu Pengeluaran.")
    
    add_heading_2(doc, "C. Panduan Penanganan Kendala (Troubleshooting)")
    
    faq_headers = ["Kendala Operasional", "Penyebab Umum", "Solusi Langkah Perbaikan"]
    faq_rows = [
        [
            "Gagal simpan transaksi: Muncul pesan 'Stok bahan baku tidak mencukupi'.",
            "Produk Made-to-Order yang dijual membutuhkan bahan baku yang stok sistemnya habis atau nol.",
            "Buka menu 'Bahan Baku & Stok'. Periksa bahan yang kurang. Jika bahan secara fisik sebenarnya ada di studio, lakukan 'Opname' stok fisik atau catat 'Beli Bahan' terlebih dahulu."
        ],
        [
            "Nama produk Shopee tidak cocok saat proses impor.",
            "Penamaan judul produk di Shopee berbeda dengan nama SKU produk yang ada di sistem pembukuan lokal.",
            "Gunakan dropdown konfirmasi manual yang muncul saat impor. Cukup pilih produk lokal yang sesuai sekali saja; sistem akan mengingat pasangan nama tersebut untuk impor seterusnya."
        ],
        [
            "Salah mengunggah file laporan Shopee.",
            "Admin tidak sengaja mengunggah file bulan sebelumnya atau file draft yang salah.",
            "Buka menu 'Impor Shopee' -> klik tombol 'Lihat Riwayat & Audit Impor'. Cari baris file yang salah lalu klik tombol merah 'Rollback'. Semua data transaksi dari file itu akan dibatalkan seketika dan stok bahan dikembalikan."
        ],
        [
            "Karyawan tidak bisa membuka menu Laporan Laba Rugi.",
            "Menu Laporan Laba Rugi, Arus Kas, dan Pengaturan dilindungi oleh sistem keamanan (khusus role OWNER).",
            "Hal ini normal sesuai kebijakan Role-Based Access Control (RBAC). Jika karyawan membutuhkan akses data, minta akun Owner untuk login atau mengekspor laporan terkait."
        ],
        [
            "Pemilik (Owner) lupa kata sandi masuk sistem.",
            "Lupa kata sandi akun Owner atau belum sempat dicatat.",
            "Klik tautan 'Lupa kata sandi?' pada layar login, masukkan email Owner dan PIN Pemulihan Rahasia (992026), lalu buat kata sandi baru. Sandi langsung aktif saat itu juga."
        ],
        [
            "Pemilik lupa kata sandi DAN lupa PIN Pemulihan.",
            "Kondisi darurat di mana kedua kunci akses tidak dapat diingat.",
            "Buka terminal komputer studio dan jalankan perintah: npm run reset-owner. Sistem otomatis mereset akun Owner kembali ke password standar 'OwnerHanifa2026!'."
        ]
    ]
    add_table_data(doc, faq_headers, faq_rows, [1.8, 1.8, 2.6])
    
    # Simpan Berkas Word
    out_filename = "Buku_Panduan_Penggunaan_Sistem_Pembukuan_CraftByHanifa.docx"
    out_path = os.path.join(os.path.dirname(__file__), out_filename)
    doc.save(out_path)
    print(f"File dokumen Word berhasil dibuat di: {out_path}")
    print(f"Ukuran file: {os.path.getsize(out_path):,} bytes")

if __name__ == "__main__":
    main()
