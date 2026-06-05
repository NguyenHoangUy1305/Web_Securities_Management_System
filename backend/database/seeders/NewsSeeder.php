<?php

namespace Database\Seeders;

use App\Models\NewsArticle;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class NewsSeeder extends Seeder
{
    public function run(): void
    {
        $news = [
            [
                'title' => 'VN-Index vượt mốc 1.300 điểm, thanh khoản đạt kỷ lục',
                'source' => 'VnEconomy',
                'url' => 'https://vneconomy.vn/',
                'summary' => 'VN-Index vượt mốc 1.300 điểm với thanh khoản hơn 30.000 tỷ đồng.',
                'content' => 'Thị trường tiếp tục đà tăng trưởng tích cực. Khối ngoại mua ròng hơn 1.500 tỷ đồng.',
                'sentiment' => 'positive',
                'published_at' => Carbon::now()->subHours(2),
            ],
            [
                'title' => 'FPT đặt mục tiêu doanh thu 2026 đạt 75.000 tỷ đồng',
                'source' => 'NDH',
                'url' => 'https://ndh.vn/',
                'summary' => 'FPT công bố kế hoạch doanh thu 75.000 tỷ, tăng 22%.',
                'content' => 'Mảng chuyển đổi số và AI được kỳ vọng là động lực tăng trưởng chính.',
                'sentiment' => 'positive',
                'published_at' => Carbon::now()->subHours(5),
            ],
            [
                'title' => 'Giá dầu thế giới giảm mạnh, tác động nhóm cổ phiếu năng lượng',
                'source' => 'Cafef',
                'url' => 'https://cafef.vn/',
                'summary' => 'Giá dầu Brent xuống thấp nhất 3 tháng, gây áp lực lên GAS, PLX.',
                'content' => 'Lo ngại suy thoái kinh tế toàn cầu khiến giá dầu lao dốc.',
                'sentiment' => 'negative',
                'published_at' => Carbon::now()->subHours(8),
            ],
            [
                'title' => 'Vinamilk (VNM) chi trả cổ tức 35% bằng tiền mặt',
                'source' => 'Vietstock',
                'url' => 'https://vietstock.vn/',
                'summary' => 'VNM chi trả cổ tức đợt 2/2025 tỷ lệ 35%.',
                'content' => 'Năm thứ 10 liên tiếp Vinamilk duy trì cổ tức trên 30%.',
                'sentiment' => 'positive',
                'published_at' => Carbon::now()->subDay(),
            ],
            [
                'title' => 'NHNN giảm lãi suất điều hành 0.25%',
                'source' => 'VnExpress',
                'url' => 'https://vnexpress.net/',
                'summary' => 'NHNN giảm lãi suất điều hành lần thứ 2 trong năm.',
                'content' => 'Hỗ trợ doanh nghiệp và thúc đẩy tăng trưởng kinh tế.',
                'sentiment' => 'positive',
                'published_at' => Carbon::now()->subDay(),
            ],
            [
                'title' => 'Hòa Phát (HPG) xuất khẩu thép sang EU tăng 45%',
                'source' => 'TinnhanhChungkhoan',
                'url' => 'https://tinnhanhchungkhoan.vn/',
                'summary' => 'Xuất khẩu thép HPG sang EU tăng mạnh nhờ nhu cầu phục hồi.',
                'content' => 'HPG ký hợp đồng cung cấp thép cho các đối tác Đức, Pháp, Ý.',
                'sentiment' => 'positive',
                'published_at' => Carbon::now()->subDays(2),
            ],
            [
                'title' => 'Techcombank (TCB) dẫn đầu tỷ lệ an toàn vốn',
                'source' => 'CafeBiz',
                'url' => 'https://cafebiz.vn/',
                'summary' => 'TCB đạt CAR 15.2%, cao nhất hệ thống ngân hàng TMCP.',
                'content' => 'Lợi nhuận quý gần nhất đạt 8.500 tỷ, tăng 18%.',
                'sentiment' => 'positive',
                'published_at' => Carbon::now()->subDays(2),
            ],
            [
                'title' => 'MWG mở rộng chuỗi BHX tại miền Tây',
                'source' => 'Nhịp sống kinh tế',
                'url' => 'https://nskt.vn/',
                'summary' => 'Thế Giới Di Động mở thêm 50 cửa hàng BHX tại miền Tây.',
                'content' => 'Doanh thu BHX tăng trưởng 25% trong 6 tháng đầu năm.',
                'sentiment' => 'positive',
                'published_at' => Carbon::now()->subDays(4),
            ],
        ];

        foreach ($news as $item) {
            NewsArticle::create($item);
        }

        $this->command->info('Created ' . count($news) . ' news articles');
    }
}
