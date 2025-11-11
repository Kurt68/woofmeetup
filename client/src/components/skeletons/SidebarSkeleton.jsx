const SidebarSkeleton = ({ error }) => {
  const skeletonContacts = Array(2).fill(null)

  return (
    <aside className="sidebar">
      {skeletonContacts.map((_, idx) => (
        <div key={idx} className="sidebar-render loading chat">
          <img className="avatar gray" />
        </div>
      ))}
      {error && <p className="server-error">{error}</p>}
    </aside>
  )
}

export default SidebarSkeleton
