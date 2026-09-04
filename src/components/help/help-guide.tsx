"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Smartphone,
  Layers,
  Sparkles,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Package,
  Boxes,
  Hammer,
  ReceiptText,
  FileSpreadsheet,
  WalletCards,
  TrendingUp,
  Settings,
  ShieldCheck,
  Calculator,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";

export function HelpGuide() {
  const [activeTab, setActiveTab] = useState<"workflow" | "mobile" | "glossary" | "faq">("workflow");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const workflowSteps = [
    {
      step: 1,
      title: "Pengaturan Master (Satuan & Kategori)",
      menu: "Pengaturan (/pengaturan)",
      icon: Settings,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      description:
        "Tentukan satuan pengukuran terkecil untuk bahan baku (misal: gram, ml, pcs, lembar) dan kelompok kategori produk kerajinan Anda.",
      actionLink: "/pengaturan",
      actionText: "Buka Pengaturan",
      points: [
        "Selalu gunakan satuan ukur terkecil yang dipakai saat meracik produk (gunakan 'gram' alih-alih 'kg' jika resin ditakar per gram).",
        "Buat kategori produk yang rapi (contoh: Gantungan Kunci, Buket Bunga, Souvenir, Aksesoris Resin).",
      ],
    },
    {
      step: 2,
      title: "Pendaftaran Bahan Baku & Stok Fisik Awal",
      menu: "Bahan Baku & Stok (/bahan-baku)",
      icon: Boxes,
      color: "text-[#E0688A] bg-pink-50 border-pink-200",
      description:
        "Daftarkan semua material mentah (resin, glitter, ring gantungan, bunga kering, pita, dll) beserta stok fisik yang ada di gudang/studio Anda.",
      actionLink: "/bahan-baku",
      actionText: "Kelola Bahan Baku",
      points: [
        "Masukkan jumlah stok fisik awal dan harga beli rata-rata satuan (Rupiah).",
        "Tentukan 'Ambang Batas Minimum' agar sistem memberi tanda peringatan saat stok bahan mulai menipis.",
        "Gunakan fitur 'Opname' untuk mengoreksi jumlah stok fisik sewaktu-waktu jika ada bahan tumpah, rusak, atau bonus dari supplier.",
      ],
    },
    {
      step: 3,
      title: "Perumusan Produk Jadi & Resep BOM (Bill of Materials)",
      menu: "Produk & Resep BOM (/produk)",
      icon: Package,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      description:
        "Daftarkan katalog produk kerajinan tangan Anda beserta resep bahan baku dan tentukan mode produksinya.",
      actionLink: "/produk/baru",
      actionText: "Tambah Produk Baru",
      points: [
        "Pilih Mode STOCK_BASED jika produk dibuat secara massal/stok siap jual (misal: gantungan kunci ready stock). Pemotongan bahan dilakukan saat proses 'Produksi Batch'.",
        "Pilih Mode MADE_TO_ORDER jika produk dibuat hanya sesuai pesanan kustom (misal: buket bunga wisuda nama). Bahan baku dipotong secara otomatis saat pesanan dicatat.",
        "Sistem secara otomatis menghitung Harga Pokok Penjualan (HPP) produk dari total harga bahan baku di resep BOM.",
      ],
    },
    {
      step: 4,
      title: "Pembelian Bahan Baku (Otomasi Moving Weighted Average)",
      menu: "Pengeluaran -> Beli Bahan (/pengeluaran/beli-bahan)",
      icon: WalletCards,
      color: "text-purple-600 bg-purple-50 border-purple-200",
      description:
        "Setiap kali Anda membeli bahan baku baru dari supplier, catat pada formulir pembelian ini.",
      actionLink: "/pengeluaran/beli-bahan",
      actionText: "Catat Belanja Bahan",
      points: [
        "Stok bahan baku di sistem akan bertambah secara instan.",
        "Sistem menerapkan rumus Moving Weighted Average: harga modal bahan diperbarui otomatis tanpa merusak riwayat transaksi lama.",
        "Nilai HPP seluruh produk yang menggunakan bahan tersebut akan ikut diperbarui secara real-time.",
      ],
    },
    {
      step: 5,
      title: "Produksi Batch & Penjualan (Offline / Shopee)",
      menu: "Produksi (/produksi) & Transaksi (/transaksi)",
      icon: Hammer,
      color: "text-[#E0688A] bg-pink-50 border-pink-200",
      description:
        "Jalankan siklus produksi untuk menambah stok barang jadi, dan catat setiap transaksi penjualan baik langsung maupun marketplace.",
      actionLink: "/transaksi/baru",
      actionText: "Kasir Penjualan",
      points: [
        "Pada menu Produksi Batch, pilih produk dan jumlah yang selesai dibuat. Stok bahan baku berkurang dan stok produk jadi bertambah.",
        "Pada menu Transaksi -> Kasir Offline, catat penjualan toko/bazar/WhatsApp. Faktur penjualan resmi langsung diterbitkan.",
        "Pada menu Impor Shopee, upload laporan penjualan dari Seller Centre. Sistem otomatis mencocokkan produk dan memotong stok.",
      ],
    },
    {
      step: 6,
      title: "Beban Operasional & Membaca Laporan Keuangan",
      menu: "Laporan Laba Rugi & Arus Kas (/laporan/laba-rugi)",
      icon: TrendingUp,
      color: "text-rose-600 bg-rose-50 border-rose-200",
      description:
        "Catat pengeluaran rutin non-bahan dan pantau performa laba bersih UMKM secara akurat.",
      actionLink: "/laporan/laba-rugi",
      actionText: "Lihat Laba Rugi",
      points: [
        "Catat biaya kemasan (kardus, bubble wrap), listrik, kuota, atau ongkos kirim pada menu Pengeluaran -> Operasional.",
        "Laba Kotor = Total Omzet Penjualan - Total HPP Bahan Baku.",
        "Laba Bersih = Laba Kotor - Total Beban Operasional.",
        "Pantau Laporan Arus Kas untuk memastikan uang kas tunai dan rekening bank Anda selalu sehat.",
      ],
    },
  ];

  const glossaryItems = [
    {
      term: "HPP (Harga Pokok Penjualan)",
      definition:
        "Total biaya modal bahan baku langsung yang dibutuhkan untuk memproduksi satu unit barang kerajinan tangan siap jual. HPP menjadi batas bawah penentuan harga jual agar bisnis Anda tidak merugi.",
    },
    {
      term: "BOM (Bill of Materials / Resep Bahan)",
      definition:
        "Daftar komposisi dan takaran bahan baku yang diperlukan untuk meracik satu buah produk. Contoh: 1 Gantungan Kunci membutuhkan 20g resin, 1 pcs ring nikel, dan 2g glitter.",
    },
    {
      term: "Mode STOCK_BASED",
      definition:
        "Metode produksi barang jadi yang dibuat terlebih dahulu sebelum ada pesanan (Ready Stock). Pengurangan bahan baku terjadi saat menu 'Produksi Batch' dijalankan, dan penjualan akan memotong stok produk jadi.",
    },
    {
      term: "Mode MADE_TO_ORDER",
      definition:
        "Metode produksi pesanan khusus/kustom (Pre-Order) yang baru dibuat saat pembeli memesan. Sistem tidak menyimpan stok produk jadi, melainkan langsung memotong bahan baku di gudang saat pesanan dicatat.",
    },
    {
      term: "Moving Weighted Average (Harga Rata-Rata Bergerak)",
      definition:
        "Metode akuntansi resmi untuk menghitung harga modal bahan saat harga beli naik atau turun. Rumus: ((Stok Lama x Harga Lama) + (Qty Beli x Harga Beli)) / (Stok Lama + Qty Beli).",
    },
    {
      term: "Opname Stok (Stock Opname)",
      definition:
        "Kegiatan pencocokan fisik antara jumlah barang riil di studio/gudang dengan angka yang tercatat di sistem komputer. Gunakan tombol 'Opname' jika ada bahan tumpah atau rusak.",
    },
    {
      term: "Laba Kotor vs Laba Bersih",
      definition:
        "Laba Kotor adalah selisih harga jual dikurangi modal bahan (HPP). Laba Bersih adalah keuntungan akhir setelah dikurangi biaya operasional lainnya (kemasan, listrik, lakban, dll).",
    },
  ];

  const faqItems = [
    {
      question: "Apa yang harus dilakukan jika saat Produksi Batch muncul pesan stok bahan tidak cukup?",
      answer:
        "Pesan tersebut adalah sistem proteksi otomatis agar stok Anda tidak menjadi negatif di database. Solusinya: 1) Catat pembelian bahan baku baru di menu 'Pengeluaran -> Beli Bahan', atau 2) Jika fisik bahan sebenarnya ada di studio, lakukan 'Opname' di menu Bahan Baku untuk memperbarui stok fisiknya.",
    },
    {
      question: "Bagaimana jika ada pelanggan yang membatalkan pesanan atau retur barang?",
      answer:
        "Buka menu 'Transaksi', klik rincian faktur transaksi terkait (`/transaksi/[id]`), pada bagian kanan atas pilih status 'CANCELLED' (Dibatalkan) atau klik tombol merah 'Hapus Transaksi'.",
    },
    {
      question: "Saya salah memasukkan harga beli bahan saat belanja, bagaimana cara memperbaikinya?",
      answer:
        "Buka menu 'Pengeluaran -> Riwayat Pembelian', Anda dapat menghapus data pembelian yang keliru, lalu buka menu 'Bahan Baku', klik tombol 'Edit' pada bahan terkait untuk menyesuaikan kembali harga satuan rata-ratanya.",
    },
    {
      question: "Apakah sistem ini bisa dipakai langsung dari handphone saat pameran atau bazar?",
      answer:
        "Ya, sistem ini 100% responsif dan mobile-friendly. Anda dapat membuka web aplikasi ini dari browser HP (Chrome/Safari), klik ikon hamburger di kiri atas untuk membuka menu, lalu pilih '+ Kasir Offline' untuk mencatat transaksi penjualan di stan pameran secara instan.",
    },
    {
      question: "Bagaimana cara kerja impor file Excel pesanan dari Shopee?",
      answer:
        "Download file laporan pesanan dari Shopee Seller Centre (format .xlsx atau .csv). Masuk ke menu 'Impor Shopee', upload file tersebut. Sistem akan mendeteksi nama produk dan otomatis mencocokkan dengan katalog CraftByHanifa Anda. Klik simpan untuk memotong stok dan mencatat omzet secara massal.",
    },
  ];

  const filteredGlossary = glossaryItems.filter(
    (g) =>
      g.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <Card className="border-t-4 border-t-[#E0688A] bg-gradient-to-r from-[#FFF5F8] to-white shadow-xs">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#E0688A] text-white rounded-lg shadow-xs">
                  <BookOpen className="w-4 h-4" />
                </span>
                <Badge variant="secondary" className="text-xs font-semibold">
                  Buku Panduan UMKM
                </Badge>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#231C20] tracking-tight">
                Pusat Bantuan & Alur Pembukuan Craft by Hanifa
              </h2>
              <p className="text-xs text-[#75656B] max-w-2xl leading-relaxed">
                Pelajari cara mengelola bahan baku, menyusun resep BOM, menghitung HPP otomatis,
                menjalankan kasir penjualan, dan membaca laporan keuangan UMKM dengan mudah.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link href="/transaksi/baru">
                <Button size="sm" className="text-xs bg-[#E0688A] text-white hover:bg-[#D45679] gap-1.5 shadow-xs font-semibold">
                  <ReceiptText className="w-3.5 h-3.5" />
                  <span>Buka Kasir Offline</span>
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#FFF5F8] border border-[#F2DBE3] rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab("workflow")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "workflow"
              ? "bg-[#E0688A] text-white shadow-xs"
              : "text-[#75656B] hover:text-[#231C20] hover:bg-pink-100/50"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Alur Kerja Sistem (6 Langkah)</span>
        </button>

        <button
          onClick={() => setActiveTab("mobile")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "mobile"
              ? "bg-[#E0688A] text-white shadow-xs"
              : "text-[#75656B] hover:text-[#231C20] hover:bg-pink-100/50"
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Panduan Input via HP</span>
        </button>

        <button
          onClick={() => setActiveTab("glossary")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "glossary"
              ? "bg-[#E0688A] text-white shadow-xs"
              : "text-[#75656B] hover:text-[#231C20] hover:bg-pink-100/50"
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Kamus Istilah (Glosarium)</span>
        </button>

        <button
          onClick={() => setActiveTab("faq")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === "faq"
              ? "bg-[#E0688A] text-white shadow-xs"
              : "text-[#75656B] hover:text-[#231C20] hover:bg-pink-100/50"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Tanya Jawab (FAQ)</span>
        </button>
      </div>

      {/* TAB 1: WORKFLOW 6 LANGKAH */}
      {activeTab === "workflow" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#FFF5F8] border border-[#F2DBE3] text-xs text-[#231C20] flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#E0688A] shrink-0 mt-0.5" />
            <p>
              Ikuti urutan langkah di bawah ini secara bertahap mulai dari Langkah 1 agar seluruh
              perhitungan HPP, mutasi stok gudang, dan laporan laba rugi berjalan otomatis dan
              bebas error.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflowSteps.map((ws) => (
              <Card key={ws.step} className="border border-[#F2DBE3] flex flex-col justify-between hover:border-[#E0688A] transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#E0688A] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {ws.step}
                      </span>
                      <CardTitle className="text-sm font-bold text-[#231C20]">
                        {ws.title}
                      </CardTitle>
                    </div>
                    <ws.icon className="w-4 h-4 text-[#75656B]" />
                  </div>
                  <CardDescription className="text-[11px] font-mono text-[#E0688A]">
                    Menu: {ws.menu}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs flex-1 flex flex-col justify-between">
                  <p className="text-[#4A3B41]">{ws.description}</p>
                  <ul className="space-y-1.5 bg-[#FFF5F8]/70 p-3 rounded-xl border border-[#F2DBE3]">
                    {ws.points.map((p, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[11px] text-[#4A3B41]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2 border-t border-[#F2DBE3]">
                    <Link href={ws.actionLink}>
                      <Button variant="ghost" size="sm" className="w-full text-xs text-[#E0688A] hover:bg-[#FFF0F4] gap-1 font-semibold">
                        <span>{ws.actionText}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PANDUAN PENGGUNAAN HP */}
      {activeTab === "mobile" && (
        <div className="space-y-4">
          <Card className="border border-[#F2DBE3]">
            <CardHeader className="pb-3 border-b border-[#F2DBE3]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-[#E0688A]" />
                </div>
                <CardTitle className="text-base font-bold text-[#231C20]">
                  Tips Efisien Input Lewat Handphone (Smartphone)
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Sistem dirancang responsif agar dapat dioperasikan langsung dari genggaman saat Anda berada di luar studio
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4 text-xs text-[#4A3B41]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#FFF5F8]/70 border border-[#F2DBE3] space-y-2">
                  <h4 className="font-bold text-[#231C20] text-sm flex items-center gap-1.5">
                    <span>1. Kasir Kilat di Bazar / Stan</span>
                  </h4>
                  <p className="text-[#75656B] leading-relaxed">
                    Saat ada pembeli di pameran atau bazar UMKM, cukup buka HP, sentuh tombol <strong>+ Kasir Offline</strong> di kanan atas, pilih produk dan jumlahnya. Klik simpan untuk langsung mencatat omzet dan memotong stok.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FFF5F8]/70 border border-[#F2DBE3] space-y-2">
                  <h4 className="font-bold text-[#231C20] text-sm flex items-center gap-1.5">
                    <span>2. Opname Fisik di Rak Gudang</span>
                  </h4>
                  <p className="text-[#75656B] leading-relaxed">
                    Bawa HP Anda langsung ke depan rak bahan baku. Buka menu <strong>Bahan Baku</strong>, hitung fisik riil resin atau glitter Anda, dan klik tombol <strong>Opname</strong> pada baris terkait untuk mengoreksi angka stok seketika.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FFF5F8]/70 border border-[#F2DBE3] space-y-2">
                  <h4 className="font-bold text-[#231C20] text-sm flex items-center gap-1.5">
                    <span>3. Catat Nota Belanja Spontan</span>
                  </h4>
                  <p className="text-[#75656B] leading-relaxed">
                    Saat membeli lakban atau bubble wrap di toko plastik, Anda bisa langsung membuka menu <strong>Pengeluaran &rarr; Operasional</strong> lewat HP dan mencatat nominal nota tanpa perlu menunggu sampai pulang ke rumah.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Navigasi Mudah di Layar HP</span>
                </p>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Gunakan tombol menu tiga garis (hamburger) di pojok kiri atas untuk berpindah antar halaman. Seluruh tabel di sistem ini dapat digeser ke samping (scroll horizontal) dengan lembut menggunakan jari Anda.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: GLOSARIUM */}
      {activeTab === "glossary" && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <Input
              placeholder="Cari istilah akuntansi / fitur..."
              className="pl-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGlossary.map((item, idx) => (
              <Card key={idx} className="border border-[#F2DBE3]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-[#231C20]">
                    {item.term}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-[#75656B] leading-relaxed">
                  {item.definition}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: FAQ */}
      {activeTab === "faq" && (
        <div className="space-y-3">
          {faqItems.map((faq, index) => {
            const isExpanded = expandedFaq === index;
            return (
              <Card key={index} className="border border-[#F2DBE3] overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-[#FFF5F8] transition-colors"
                >
                  <span className="font-bold text-xs sm:text-sm text-[#231C20]">
                    {faq.question}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#75656B] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#75656B] shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <CardContent className="p-4 pt-0 text-xs text-[#4A3B41] leading-relaxed border-t border-[#F2DBE3] bg-[#FFF5F8]/40">
                    {faq.answer}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Footer Support Card */}
      <Card className="border border-[#F2DBE3] bg-[#FFF5F8]/50">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div>
            <p className="font-bold text-[#231C20]">Butuh Bantuan Lebih Lanjut?</p>
            <p className="text-[#75656B] text-[11px]">
              Sistem Operasional & Pembukuan Craft by Hanifa
            </p>
          </div>
          <Link href="/pengaturan">
            <Button variant="outline" size="sm" className="text-xs gap-1 border-[#E8C5D1]">
              <Settings className="w-3.5 h-3.5 text-[#75656B]" />
              <span>Buka Konfigurasi Master</span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
