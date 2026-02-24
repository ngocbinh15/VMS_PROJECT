using LANHossting.Data;
using LANHossting.Application.Interfaces;
using LANHossting.Application.Services;
using LANHossting.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// DbContext with EF logging
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
    .LogTo(Console.WriteLine, LogLevel.Information)
    .EnableSensitiveDataLogging(builder.Environment.IsDevelopment())
);

// Clean Architecture DI
builder.Services.AddScoped<ITonKhoRepository, TonKhoRepository>();
builder.Services.AddScoped<ITonKhoService, TonKhoService>();
builder.Services.AddScoped<IVatLieuRepository, VatLieuRepository>();
builder.Services.AddScoped<IVatLieuService, VatLieuService>();
builder.Services.AddScoped<IGiaoDichRepository, GiaoDichRepository>();
builder.Services.AddScoped<IGiaoDichService, GiaoDichService>();

// ✅ THÊM 2: Cấu hình Session cho Authentication
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromHours(2); // Session timeout 2 giờ
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.Name = ".VMS.Session";
});

// ✅ THÊM 3: HttpContextAccessor để truy cập Session
builder.Services.AddHttpContextAccessor();

// ✅ GIỮ NGUYÊN: cấu hình LAN
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(5000);
});

builder.Services.AddControllersWithViews();

var app = builder.Build();


// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
}

app.UseStaticFiles();

app.UseRouting();

// ✅ THÊM 4: Sử dụng Session
app.UseSession();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Login}/{action=Index}/{id?}");

app.Run();
