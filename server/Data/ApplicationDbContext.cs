using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using server.Models;

namespace server.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<TestEntity> TestEntities => Set<TestEntity>();
    public DbSet<Inventory> Inventories => Set<Inventory>();
    public DbSet<Item> Items => Set<Item>();
    public DbSet<InventoryUserAccess> InventoryUserAccesses => Set<InventoryUserAccess>();
    public DbSet<InventoryType> InventoryTypes => Set<InventoryType>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Like> Likes => Set<Like>();
    public DbSet<InventoryTag> InventoryTags => Set<InventoryTag>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Item>()
            .Property(i => i.Data)
            .HasColumnType("jsonb");

        builder.Entity<InventoryUserAccess>()
            .HasKey(x => new { x.InventoryId, x.UserId });

        builder.Entity<InventoryUserAccess>()
            .HasOne(x => x.Inventory)
            .WithMany()
            .HasForeignKey(x => x.InventoryId);

        builder.Entity<InventoryUserAccess>()
            .HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId);

        builder.Entity<Item>()
            .HasIndex(i => new { i.InventoryId, i.CustomId })
            .IsUnique();

        builder.Entity<Inventory>()
            .Property(i => i.CustomFields)
            .HasColumnType("jsonb");

        builder.Entity<Inventory>()
            .Property(i => i.CustomIdConfig)
            .HasColumnType("jsonb");

        builder.Entity<InventoryTag>()
            .HasIndex(x => new { x.InventoryId, x.Tag })
            .IsUnique();

        builder.Entity<InventoryTag>()
            .Property(x => x.Tag)
            .HasMaxLength(100);

        builder.Entity<InventoryTag>()
            .HasOne(x => x.Inventory)
            .WithMany(x => x.Tags)
            .HasForeignKey(x => x.InventoryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<InventoryType>().HasData(
            new InventoryType { Id = 1, NameRu = "Электроника", NameEn = "Electronics", Prefix = "ELEC" },
            new InventoryType { Id = 2, NameRu = "Книги", NameEn = "Books", Prefix = "BOOK" },
            new InventoryType { Id = 3, NameRu = "Одежда и обувь", NameEn = "Apparel", Prefix = "WEAR" },
            new InventoryType { Id = 4, NameRu = "Мебель", NameEn = "Furniture", Prefix = "FURN" },
            new InventoryType { Id = 5, NameRu = "Инструменты", NameEn = "Tools", Prefix = "TOOL" },
            new InventoryType { Id = 6, NameRu = "Автотовары", NameEn = "Automotive", Prefix = "AUTO" },
            new InventoryType { Id = 7, NameRu = "Спортивные товары", NameEn = "Sports", Prefix = "SPORT" },
            new InventoryType { Id = 8, NameRu = "Медицинские товары", NameEn = "Medical", Prefix = "MEDI" },
            new InventoryType { Id = 9, NameRu = "Продукты питания", NameEn = "Food", Prefix = "FOOD" },
            new InventoryType { Id = 10, NameRu = "Косметика и уход", NameEn = "Cosmetics", Prefix = "COSM" },
            new InventoryType { Id = 11, NameRu = "Строительные материалы", NameEn = "Construction", Prefix = "CONS" },
            new InventoryType { Id = 12, NameRu = "Прочее", NameEn = "Miscellaneous", Prefix = "MISC" }
        );

        builder.Entity<Comment>()
            .HasOne(c => c.Inventory)
            .WithMany()
            .HasForeignKey(c => c.InventoryId);

        builder.Entity<Comment>()
            .HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId);

        builder.Entity<Like>()
            .HasOne(l => l.Item)
            .WithMany()
            .HasForeignKey(l => l.ItemId);

        builder.Entity<Like>()
            .HasOne(l => l.User)
            .WithMany()
            .HasForeignKey(l => l.UserId);

        builder.Entity<Like>()
            .HasIndex(l => new { l.UserId, l.ItemId })
            .IsUnique();

        builder.Entity<Inventory>()
            .HasGeneratedTsVectorColumn(
                i => i.SearchVector,
                "english",
                i => new { i.Title, i.Description })
            .HasIndex(i => i.SearchVector)
            .HasMethod("GIN");
    }
}